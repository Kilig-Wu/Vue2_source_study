import Dep, { popTarget, pushTarget } from "./dep";

let id = 0;
//组件化好处：方便，复用，局部更新


//1) 当我们创建渲染watcher的时候我们会把当前的渲染watcher方法Dep.target上
//2)调用_render() 会取值 走到Object.defineProperty的get上

class Watcher {   //每个组件都有自己的watcher new Watcher  exprOrfn: 表达式或函数
    constructor(vm, exprOrfn, options, cb) {  //vm: 当前watcher对应的是哪个实例 fn: 这个实例对应的渲染函数vm._update(vm._render())
        this.id = id++;
        this.renderWatcher = options  //是一个渲染watcher

        if(typeof exprOrfn === 'string') {
            this.getter = function() {
                return vm[exprOrfn]
            } 
        } else {
            this.getter = exprOrfn;  //getter意味着调用这个函数可以发生取值操作
        }
        this.deps = [];   //watcher记住dep（以便实现计算属性、一些清理工作（组件卸载））
        this.depIds = new Set();
        this.lazy = options.lazy;
        this.cb = cb;
        this.dirty = this.lazy; //缓存值
        this.vm = vm;
        this.user = options.user  //标识是否是用户自己的watcher

        this.value = this.lazy ? undefined :  this.get();
    };
    addDep(dep) {  //一个组件对应多个属性，重复的属性不用记录
        let id = dep.id;
        if (!this.depIds.has(id)) {
            this.deps.push(dep);
            this.depIds.add(id);
            dep.addSub(this); //watcher记住了dep而且去重了，此时dep也记住了watcher
        }
    };
    evaluate() {
        this.value = this.get();  //获取到用户函数的返回值，并且标识为脏
        this.dirty = false;
    };
    get() {
        // Dep.target = this; //静态属性  
        pushTarget(this) //静态属性；在渲染页面之前给dep添加watcher（会把当前的渲染watcher放到Dep.target上）

        let value = this.getter.call(this.vm)  //渲染页面，会去vm上取值, vm._update(vm._render)取name和age
        
        // Dep.target = null; //渲染完毕清空
        popTarget()  //渲染完毕清空 在渲染页面之后给dep取消watcher

        return value
    };
    //watcher里的depend就是让wahtcher中的dep去depend
    depend() {
        let i = this.deps.length;
        while(i--) {
            //dep.depend()
            this.deps[i].depend();  //让计算属性watcher的dep也收集渲染watcher
        }
    };
    update() {
        if(this.lazy) {
            //如果是计算属性,计算的值变化了 就标识计算属性是脏值了
            this.dirty = true;
        } else {
            queueWatcher(this);  //把当前的watcher暂存
            // this.get(); //重新渲染
        }
    };
    run() {
        let oldValue = this.value;
        let newValue = this.get();  
        if(this.user) {
            this.cb.call(this.vm, newValue, oldValue)
        }
    }
}
let queue = [];
let has = {};
let pending = false; //防抖

function flushSchedulerQueue() {
    let flushQueue = queue.splice(0);  //拷贝一份queue
    queue = [];
    has = {}
    pending = false;
    flushQueue.forEach(q => q.run()); //在属性过程中可能还有新的watcher,重新放到queue中
}
//异步更新
function queueWatcher(watcher) {
    const id = watcher.id;
    if (!has[id]) {
        queue.push(watcher);
        has[id] = true;
        //不管update执行多少次，但是最终只执行一轮刷新操作(防抖)
        if (!pending) {
            nextTick(flushSchedulerQueue)
            pending = true;
        }
    }
}

 //异步批处理，如果单纯的添加setTimeout会很耗性能
let callbacks = [];
let waiting = false;
function flushCallbacks() {
    let cbs = callbacks.splice(0)
    waiting = false;
    callbacks = [];
    cbs.forEach(cb => cb())
}
//nextTick没有直接使用某个api 而是采用优雅降级的方式
//内部先采用的promise(ie不兼容) -》MutationObserver(h5的api) -》可以考虑ie专用的setImmediate -》setTimeout（优先级和效率排序）
let timerFunc;
if(Promise) {  //可以把Promise转成字符串toString，判断是不是原生的Promise
    timerFunc = () => {
        Promise.resolve().then(flushCallbacks)  //vue3中直接使用这个，不兼容ie
    }
} else if(MutationObserver) {
    let observer = new MutationObserver(flushCallbacks); //这里传入的回调时异步执行的
    let textNode = document.createTextNode(1); //监控文本的变化
    observer.observe(textNode, {
        characterData: true
    })
    timerFunc = () => {
        textNode.textContent = 2;  //文本变了执行flushCallbacks
    }
} else if(setImmediate) {
    timerFunc = () => {
        setImmediate(flushCallbacks)
    }
} else if(setTimeout) {
    timerFunc = () => {
        setTimeout(flushCallbacks)
    }
}
export function nextTick(cb) {  
    callbacks.push(cb);  //维护nextTick中的callback方法
    if(!waiting) {
        timerFunc()  //最后一起刷新
        // setTimeout(() => { 
        //     flushCallbacks()  
        // }, 0);
        waiting = true;
    }
}
// 给每个属性增加一个dep,目的就是为了收集watcher
//1个视图（组件）中有多个属性（n个属性会对应一个视图）-》n个dep对应一个watcher
//1个属性对应多个视图(组件) -》1个dep对应多个watcher
export default Watcher