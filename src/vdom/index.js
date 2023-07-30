//h() _c()
//是否原始标签（是组件还是原生标签）
const isReservedTag = (tag) => {
    return ['a', 'div', 'p','button', 'ul', 'li', 'span'].includes(tag)
}
export function createElementVNode(vm, tag, data = {}, ...children) {
    if(data == null) {
        data = {}
    }
    let key = data.key;
    if(key) {
        delete data.key
    }
    if(isReservedTag(tag)) {
        //原始标签
        return vnode(vm, tag, key, data, children)
    } else {
        //组件
        let Ctor = vm.$options.components[tag] //组件的构造函数
        return createComponentVnode(vm, tag, key, data, children, Ctor)
    }
} 

function createComponentVnode(vm, tag, key, data, children, Ctor) {
    if(typeof Ctor === 'object') {
        //Vue.extend(Ctor)
        Ctor = vm.$options._base.extend(Ctor)
    }
    data.hook = {
        init(vnode) {  //稍后创造真实节点的时候 如果是组件调用此init方法
            //保存组件的实例到虚拟节点上
            let instance = vnode.componentInstance = new vnode.componentOptions.Ctor;
            instance.$mount();   //instance.$el
        }
    }
    return vnode(vm, tag, key, data, children, null, { Ctor })
}

//_v()
export function createTextVNode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text)
}

//ast做的是语法的转化 描述的是语法本身（可以描述js css html）
//我们的虚拟dom 是描述dom元素，可以增加一些自定义属性（描述dom的）
function vnode(vm, tag, key, data, children, text, componentOptions) {
    return { 
        vm, 
        tag, 
        key, 
        data, 
        children, 
        text ,
        componentOptions  //包含组件的构造函数
    }
}

//判断两节点是否同一节点
export function isSameVNode(vnode1, vnode2) {
    return vnode1.tag ===  vnode2.tag && vnode1.key === vnode2.key
}
