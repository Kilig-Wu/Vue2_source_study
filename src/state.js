
import Dep from "./observe/dep";
import { observe } from "./observe/index";
import Watcher, { nextTick } from './observe/watcher'

export function initState(vm) {
    const opts = vm.$options //获取所有的选项

    if (opts.data) {
        initData(vm)
    }
    if (opts.computed) {
        initComputed(vm)
    }
    if (opts.watch) {
        initWatch(vm)
    }
}
function initWatch(vm) {
    let watch = vm.$options.watch;
    for (let key in watch) {
        const handler = watch[key]  //字符串、数组、函数、对象
        if (Array.isArray(handler)) {
            for (let i = 0; i < handler.length; i++) {
                createWatcher(vm, key, handler[i])
            }
        } else {
            createWatcher(vm, key, handler)
        }
    }
}
function createWatcher() {
    //字符串 函数 对象（未处理对象）
    if (typeof handler === 'string') {
        handler = vm[handler]  //取methods里的方法
    }
    return vm.$watch(key, handler)
}

function proxy(vm, target, key) {
    Object.defineProperty(vm, key, { //vm.name
        get() {
            return vm[target][key]  //vm._data.name
        },
        set(newValue) {
            vm[target][key] = newValue;
        }
    })
};
function initData(vm) {
    let data = vm.$options.data  //data可能是函数和对象
    data = typeof data === 'function' ? data.call(vm) : data;
    vm._data = data;

    //数据劫持: vue2:defineProperty
    observe(data);

    //将vm._data用vm来代理
    for (let key in data) {
        proxy(vm, '_data', key)
    }
}

function initComputed(vm) {
    const computed = vm.$options.computed;
    const watchers = vm._computedWatchers = {};   //vm._computedWatchers是为了在createComputedGetter函数中拿到watcher
    for (let key in computed) {
        let userDef = computed[key];

        //需要监控计算属性的get方法(防止多次触发同一个)
        let getter = typeof userDef === 'function' ? userDef : userDef.get;
        watchers[key] = new Watcher(vm, getter, { lazy: true })  //lazy: true;->new Watcher时fn不会立即执行

        defineComputed(vm, key, userDef)
    }
}
function defineComputed(target, key, userDef) {
    const setter = userDef.set || (() => { })
    Object.defineProperty(target, key, {
        get: createComputedGetter(key),
        set: setter
    })
}
//计算属性根本不会收集依赖，只会让自己的依赖去收集依赖
function createComputedGetter(key) {
    //我们检测需要是否执行这个getter
    return function () {
        const watcher = this._computedWatchers[key]   //获取到对应属性的watcher
        if (watcher.dirty) {
            //如果是脏的，就执行用户传入的函数
            watcher.evaluate()  //求值后dirty变为false, 下次就不求值了
        }
        if (Dep.target) {  //计算属性出栈后是否有渲染过程，如果有，我应该让计算属性watcher里的属性也去收集上一层watcher(渲染warcher)
            watcher.depend()   //不执行这一步的话，页面只是更新了计算属性的值 却不会重新渲染页面
        }
        return watcher.value  //最后返回的是watcher上的值
    }
}

export function initStateMixin(Vue) {
    Vue.prototype.$nextTick = nextTick

    //exprOrFn：表达式或  cb:回调   options：{ deep： ture }=>未处理
    Vue.prototype.$watch = function (exprOrFn, cb) {
        //firstname的值变化了 直接执行cb函数即可
        new Watcher(this, exprOrFn, { user: true }, cb)
    }
}