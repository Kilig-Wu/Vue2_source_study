import { newArrayProto } from './array'
import Dep from './dep'
class Observer {
    constructor(data) {
        //给每个对象都增加收集功能
        this.dep = new Dep()

        //Object.defineProperty只能劫持已经存在的属性（删除新增的都没法，vue2里会单独写一些api $set $delete）
        Object.defineProperty(data, '__ob__', {  //可枚举的话会进入死循环
            value: this,
            enumerable: false //将__ob__ 变成不可枚举（循环时无法获取到）
        })
        // data.__ob__ = this;  //给数据加了一个标识， 如果数据上有__ob__则说明这个属性被观测过了

        if(Array.isArray(data)) {
            //如果是数组的话，需要对数组新增的属性去做判断，并且对新增的属性进行观测
            //这里重写数组的方法（数组劫持的核心就是重写数组的方法，并且去观测数组中的每一项）
            data.__proto__ = newArrayProto  //需要保留数组原有的特性，并可以重写部分方法
            this.observeArray(data)  //观测数组里的属性，如果数组里有对象，可以监控到对象的变化
        } else {
            this.walk(data)
        }
    };
    walk(data) {  //循环对象，对属性依次劫持

        //“重新定义”属性-》性能差
        Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
    };
    observeArray(data) {
        data.forEach(item => observe(item))
    }
}
//深层次嵌套会递归，递归多了性能差，不存在的属性性能差，存在的属性要重写方法（push, pop等）
function dependArray(value) {
    for(let i = 0; i < value.length; i++) {
        //数组的每一项都依赖收集
        let current = value[i];
        current.__ob__ && current.__ob__.dep.depend();
        if(Array.isArray(current)) {
            dependArray(current)
        }
    }
}
export function defineReactive(target, key, value) {  //闭包 属性劫持
    let childOb = observe(value); //对所有的对象进行属性劫持（递归）,childOb.dep用来收集依赖的
    let dep = new Dep(); //每一个属性都有一个dep（收集器）
    Object.defineProperty(target, key, {
        get() {  //取值执行
            if(Dep.target) {
                dep.depend();  //让这个属性的收集器记住当前的watcher
                if(childOb) {
                    childOb.dep.depend()  //让数组和对象也实现依赖收集（使用push等方法可以触发更新）
                    if(Array.isArray(value)) {   // arr: [1, 2, 3, { a:1}, ['a', 'b']],  给['a', 'b']添加依赖收集
                        dependArray(value)
                    }
                }
            }
            return value
        },
        set(newValue) {  //修改执行
            if(newValue === value) return
            observe(newValue)
            value = newValue;
            //观察者身份 Obverser，当数据变化后，会发送通知给Dep对象，也就是发布订阅模式中的时间中心（经纪人），然后又Dep 告诉订阅着 Watcher 对象， Watcher 便响应式地触发了 render重新渲染的过程。
            dep.notify()  //通知更新
        }
    })
}

export function observe(data) {
    //对这个对象进行劫持

    if(typeof data !== 'object' || data == null) {
        return; //只对对象进行劫持
    }
    /**
     * instanceof 用于检测构造函数的 prototype 属性是否出现在某个实例对象的原型链上。
     * 语法：object instanceof constructor [object：某个实例对象  constructor：某个构造函数]
     * **/
    if(data.__ob__ instanceof Observer) {  //说明这个对象被代理过了
        return data.__ob__
    }
    //如果一个对象被劫持过了，那就不需要再被劫持了（要判断一个对象是否被劫持过，可以添加一个实例，用实例来判断是否被劫持过）
    return new Observer(data)
}