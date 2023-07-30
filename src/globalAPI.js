import { mergeOptions } from "./utils";

export function initGlobalAPI(Vue) {
    //静态方法
    Vue.options = {
        _base: Vue
    };  
    Vue.mixin = function (mixin) {
        //我们期望将用户的options和全局的options进行合并
        this.options = mergeOptions(this.options, mixin);
        return this
    }

    
    //可以手动创建组件进行挂载
    Vue.extend = function (options) {
        function Sub(options = {}) {  //最终使用一个组件 就是new一个实例
            this._init(options)  //默认对子类进行初始化操作
        }
        Sub.prototype = Object.create(Vue.prototype)   //Sub.prototype.__proto__ = Vue.prototype   Sub继承Vue
        Sub.prototype.constructor = Sub   //Object.create创建的Sub.prototype会默认指向Sub的父类Vue
        Sub.options = mergeOptions(Vue.options, options);  //保存用户传的选项
        return Sub
    }

    Vue.options.components = {};   //全局指令 Vue.options.derectives
    Vue.component = function(id, definition) {
        //如果definition已经是一个函数了，说明用户自己调用了Vue.extend
        definition = typeof definition === 'function' ? definition : Vue.extend(definition)
        Vue.options.components[id] = definition;
    }
}