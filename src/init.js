
import { initState  } from "./state";
import { compileToFunction } from './compiler'
import { callHook, mountComponent } from "./lifecycle";
import { mergeOptions } from "./utils";
export function initMixin(Vue) {   
    Vue.prototype._init = function(options) {  //初始化操作
        const vm = this;
        //this.constructor = Vue, 将Vue.options和用户的options合并
        //定义的全局指令和过滤器..都会挂载到实例上(this.constructor可能是子组件)
        vm.$options = mergeOptions(this.constructor.options, options)   //将用户的选项挂在原型实例上，防止其他原型属性上需要options

        callHook(vm, 'beforeCreate')
        //初始化状态（状态包括props,watch,computed等。。）
        initState(vm)
        callHook(vm, 'created')

        if(options.el) {
            vm.$mount(options.el)   //实现数据的挂载
        }
    }
    Vue.prototype.$mount = function(el) {
        const vm = this;
        el = document.querySelector(el)
        let ops = vm.$options
        if(!ops.render) {  //先查找有没有render函数
            let template; 
            if(!ops.template && el) {  //没有写模板 但是写了el
                 //没有render看一下是否写了template,没写template采用外部的template
                template = el.outerHTML
            } else {
                template = ops.template
            }
            //写了template就用写了的template
            if(template) {
                //需要对模板进行编译
                const render = compileToFunction(template);
                ops.render = render  //jsx最终会编译成h('xxx')
            }
        }
        mountComponent(vm, el); //组件的挂载
        //最终可以获取render方法

        //script标签引用的vue.global.js,整个编译过程是在浏览器运行的
        //runtime(运行时)是不包含模板编译的，整个编译过程是打包的时候通过loader来转义.vue文件的，用runtime的时候不能使用template
    }
}
