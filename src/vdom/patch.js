import { isSameVNode } from "./index";

function createComponent(vnode) {
    let i = vnode.data;
    if((i = i.hook) && (i = i.init)) {
        i(vnode)  //初始化组件,找到init方法
    }
    if(vnode.componentInstance) {
        return true   //说明是组件
    }
}
export function createElm(vnode) {
    let { tag, data, children, text } = vnode;
    if(typeof tag === 'string') {  //标签

        //创建真实元素 也要判断是组件还是元素
        if(createComponent(vnode)) {
            //组件 vnode.componentInstance.$el
            return vnode.componentInstance.$el
        }

        vnode.el = document.createElement(tag) //这里将真实节点和虚拟节点对应起来，后续如果修改了（属性等），可以直接找到虚拟节点对应的真实节点来进行修改

        patchProps(vnode.el, {}, data);  //更新属性
        children.forEach(child => {
            vnode.el.appendChild(createElm(child))
        });
    } else { //文本
        vnode.el = document.createTextNode(text)
    }
    return vnode.el
}

//设置属性
export function patchProps(el, oldProps = {}, props = {}) {

    // 老的样式中有 新的没有，需要删除老的
    let oldStyles = oldProps.style || {};
    let newStyles = props.style || {};
    for(let key in oldStyles) {
        if(!newStyles[key]) {
            el.style[key] = ''
        }
    }
    for(let key in oldProps) {  //老的属性有新的没有
        if(!props[key]) {
            el.removeAttribute(key)
        }
    }

    for(let key in props) {  //用新的覆盖老的
        if(key === 'style') {
            //如果是样式
            for(let styleName in props.style) {
                el.style[styleName] = props.style[styleName];
            }
        } else {
            el.setAttribute(key, props[key])
        }
    }
}

export function patch(oldVNode, vnode) {
    if(!oldVNode) {  //oldVNode不存在就是组件的挂载
        return createElm(vnode)   //$vm.$el就是组件渲染的结果
    }
    //
    const isRealElement = oldVNode.nodeType;  //nodeType为dom原生方法
    //是否真实元素
    if(isRealElement) {
        const elm = oldVNode;
        const parentElm = elm.parentNode  //获取父元素
        let newElm = createElm(vnode)  //新dom
        parentElm.insertBefore(newElm, elm.nextSibling)  //把新生成的节点插入到老节点后面 insertBefore(newNode, referenceNode) 方法在参考节点之前插入一个拥有指定父节点的子节点  nextSibling 属性可返回某个元素之后紧跟的元素
        parentElm.removeChild(elm)  //删除老节点

        return newElm  //返回新dom
    } else {
        //diff算法
        //1.两个节点不是同一个节点，直接删除老的换上新的
        //2.两个节点是同一个节点（判断节点的tag和key）,比较两个节点的属性是否有差异（复用老的节点 ，将差异的属性更新）
        //3.节点比较完毕后就需要比较两人的儿子

        patchVNode(oldVNode, vnode)

       
    }
}
function patchVNode(oldVNode, vnode) {
     //不相同节点
     if(!isSameVNode(oldVNode, vnode)) {
        //两节点不是同一节点， 用老节点的父亲进行替换
        let el = createElm(vnode);
        oldVNode.el.parentNode.replaceChild(el, oldVNode.el)
        return el;
    }

    //相同节点
    let el = vnode.el = oldVNode.el;  //复用老节点的元素
    //是文本
    if(!oldVNode.tag) {
        if(oldVNode.text !== vnode.text) {
            el.textContent = vnode.text  //用新文本替换老的
        }
    }
    //是标签   需要比较标签的属性   vnode.data-新标签的属性    oldVNode.data-老标签的属性
    patchProps(el,oldVNode.data, vnode.data)

    //比儿子节点（1.一方有儿子，一方没儿子2.两方都有儿子）
    let newChildren = oldVNode.children || [];
    let oldChildren = vnode.children || [];
    if(oldChildren.length > 0 && newChildren.length > 0) {
        //两个都有儿子，比较两人的儿子
        updateChildren(el, oldChildren, newChildren)
    } else if(newChildren.length > 0) {
        //老的没有儿子， 新的有儿子（把新的儿子放老的里面）
        mountChildren(el, newChildren);
    } else if(oldChildren.length > 0) {
        //老的有儿子， 新的没有儿子（把老的儿子都删了）
        el.innerHTML = '';   //innerHTML不太安全（此处是为了方便），可以循环删除
    }

    return el
}
function mountChildren(el, newChildren) {
    for(let i = 0; i < newChildren.length; i++) {
        let child = newChildren[i];
        el.appendChild(createElm(child))
    }
}


function updateChildren(el, oldChildren, newChildren) {
    //vue2中采用双指针的方式比较两个节点
    let oldStartIndex = 0;
    let newStartIndex = 0;
    let oldEndIndex = oldChildren.length - 1;
    let newEndIndex = newChildren.length - 1;

    let oldStartVnode = oldChildren[0];
    let newStartVnode = newChildren[0];

    let oldEndVnode = oldChildren[oldEndIndex];
    let newEndVnode = newChildren[newEndIndex];

    function makeIndexByKey(children) {
        let map = {}  //key和索引的映射
        children.forEach((child, index) => {
            map[child.key] = index
        })
        return map
    }
    let map =  makeIndexByKey(oldChildren);
    while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        //双方有一方头指针大于尾指针则停止循环
        if(!oldStartVnode) { //1
            oldStartVnode = oldChildren[++oldStartIndex]
        } else if(!oldEndVnode) { //1
            oldEndVnode = oldChildren[--oldEndIndex]
        } else if(isSameVNode(oldStartVnode,newStartVnode)) {    
            //从前往后比 abcd -> abcde
            patchVNode(oldStartVnode,newStartVnode)  //如果相同，则递归比较字节点
            oldStartVnode = oldChildren[++oldStartIndex];
            newStartVnode = newChildren[++newStartIndex];
        } else if(isSameVNode(oldEndVnode,newEndVnode)) {  
            //从后往前比 abcd -> eabcd
            patchVNode(oldEndVnode,newEndVnode)  //如果相同，则递归比较字节点
            oldEndVnode = oldChildren[--oldEndIndex];
            newEndVnode = newChildren[--newEndIndex];
        } else if(isSameVNode(oldEndVnode,newStartVnode)) {  //
            //交叉比 abcd -> dcba
            patchVNode(oldEndVnode,newStartVnode)  //如果相同，则递归比较字节点
            el.insertBefore(oldEndVnode.el, oldStartVnode.el)
            oldEndVnode = oldChildren[--oldEndIndex];
            newStartVnode = newChildren[++newStartIndex];
        } else if(isSameVNode(oldStartVnode,newEndVnode)) {  //
            //交叉比 dcba -> abcd
            patchVNode(oldStartVnode,newEndVnode)  //如果相同，则递归比较字节点
            el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
            oldStartVnode = oldChildren[++oldStartIndex];
            newEndVnode = newChildren[--newEndIndex];
        } else {
            //乱序比对（根据老的列表做一个映射关系）abcd -> bmapcq
            let moveIndex = map[newStartVnode.key];
            if(moveIndex !== undefined) {
                let moveVnode = oldChildren[moveIndex]; //找到对应的虚拟节点复用
                el.insertBefore(moveVnode.el, oldStartVnode.el);
                oldChildren[moveIndex] = undefined;  //表示这个节点已经移走了(会导致添加1处的判断)
                patchVNode(moveVnode, newStartVnode)  //比对属性和节点
            } else {
                el.insertBefore(createElm(newStartVnode), oldStartVnode.el)
            }
            newStartVnode = newChildren[++newStartIndex]  //新列表开始指针不停后移
        }

        if(newStartIndex <= newEndIndex) {  //新的多余的就新增的插入进去   //有误
            for(let i = newStartIndex; i <= newEndIndex; i++) {
                let chidEl = createElm(newChildren[i]);
                //可能向前可能向后追加
                let anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null  //获取下一个元素
                el.insertBefore(chidEl, anchor); //anchor为null的时候则会认为是appendchild
            }
        }
        if(oldStartIndex <= oldEndIndex) {  //老的多余的就删除多余的老的
            for(let i = oldStartIndex; i <= oldEndIndex; i++) {
                if(oldChildren[i]) { //1
                    let childEl = oldChildren[i].el
                    el.removeChild(childEl)
                }
            }
        }
       
    }

}