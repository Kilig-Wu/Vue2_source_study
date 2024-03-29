//重写数组中的部分方法
let oldArrayProto = Array.prototype   //获取数组的原型

//newArrayProto.__proto__ = oldArrayProto
export let newArrayProto = Object.create(oldArrayProto)
let methods = [ 'push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice']

methods.forEach(method => {
    newArrayProto[method] = function(...args) {   //这里重写了数组的方法
        const result = oldArrayProto[method].call(this, ...args)  //内部调用原来的方法（函数的劫持、切片编程）

        //我们需要对新增的数据再进行劫持
        let inserted;
        let ob = this.__ob__;
        switch(method) {
            case 'push':
            case 'unshift':   //arr.unshift(1, 2, 3)
                inserted = args;
                break;
            case 'splice':     //arr.splice(0, 1, { a: 1 }, {a: 1})
                inserted = args.slice(2);  
                break;
            default:
                break;
        }
        if(inserted) {  //如果有新增的内容，要对新增的内容再次进行观测
            ob.observeArray(inserted)
        }
        
        ob.dep.notify();  //数组变化了，通知对应的watcher更新

        return result
    }
})