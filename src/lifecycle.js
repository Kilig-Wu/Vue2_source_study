import Watcher from "./observe/watcher";
import { createElementVNode, createTextVNode } from "./vdom";
import { patch } from "./vdom/patch";


export function initLifeCycle(Vue) {
    Vue.prototype._update = function(vnode) {  //将vnode装化成真实dom
        const vm = this;
        const el = vm.$el;

        const preVnode = vm._vnode;
        vm._vnode = vnode;   //把组件第一次产生的虚拟节点保存到vnode上
        if(preVnode) {  
            //有的化表示之前渲染过了
            vm.$el = patch(preVnode, vnode);  //diff算法执行 preVnode和vnode比对
        } else {
            vm.$el = patch(el, vnode);
        }


        //patch既有初始化的功能,又有更新的功能
    }
    //_c('div', {}, ...children)
    Vue.prototype._c = function() {
        return createElementVNode(this, ...arguments)
    }
    //_v(text)
    Vue.prototype._v = function() {
        return createTextVNode(this, ...arguments)
    }
    Vue.prototype._s = function(value) {
        if(typeof value !== 'object') return value 
        return JSON.stringify(value)
    }
    Vue.prototype._render = function() {
        //call让with中的this指向vm
        //当渲染时会去实例中取值，我们就可以将属性和试图绑定在一起
        return this.$options.render.call(this)  //通过ast语法转义生成的render方法
    }
}
export function mountComponent(vm, el) { //这里的el是通过querySelector处理过的
    vm.$el = el;
    //1.调用render方法产生虚拟节点，虚拟dom
    // vm._update(vm._render());  //vm.$options.render()->返回虚拟节点
    const updateComponent = () => {  //updateComponent渲染页面
        vm._update(vm._render());  //vm.$options.render()->返回虚拟节点
    }
    let watcher = new Watcher(vm, updateComponent, true)  //true用于标识是一个渲染watcher

    //2.根据虚拟Dom产生真实Dom

    //3.插入到el元素中

}

//vue核心流程 创造了响应式数据 -> 模板转化成了ast语法树 -> 将ast语法树转换了render函数 -> 后续每次数据更新可以只执行render函数，无需再执行ast转化的过程

//render函数会去产生虚拟节点（使用响应式数据）
//根据虚拟的节点创造真实的Dom

export function callHook(vm, hook) {
    const handlers = vm.$options[hook];
    if(handlers) {
        handlers.forEach(handler => handler.call(vm))
    }
}