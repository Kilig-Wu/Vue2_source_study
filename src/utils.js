
const strats = {};
const LIFECYCLE = [
    'beforeCerated',
    'created'
]
LIFECYCLE.forEach(hook => {
    // {} {created: function() {}} => {created: [fn]}  一个mixin
    // {created: [fn]} {created: function() {}} => { created: [fn, fn] }  2个mixin
    //{ created: [fn, fn] } {created: function() {}} => { created: [fn, fn, fn] }  3个mixin
    strats[hook] = function (p, c) {
        if (c) {
            if (p) {
                return p.concat(c)
            } else {
                return [c]
            }
        } else {
            return p
        }
    }
})
strats.components = function(parentVal, childVal) {
    const res = Object.create(parentVal);
    if(childVal) {
        for(let key in childVal) {
            res[key] = childVal[key]  //返回的是构造的对象， 可以拿到父亲原型上的属性 并且将儿子的都拷贝到自己的身上
        }
    }
    return res
}
// strats.data = function() { //合并data
// }
// strats.computed = function() {
// }
// strats.watch = function() {
// }
export function mergeOptions(parent, child) {
    const options = {};
    for(let key in parent) {
        mergeField(key)
    }
    for(let key in child) {
        if(!parent.hasOwnProperty(key)) {
            mergeField(key)
        }
    }
    function mergeField(key) {
        //策略模式减少if/else(策略很多，因为生命周期很多)
        if(strats[key]) {
            options[key] = strats[key](parent[key], child[key])
        } else {
            //如果不在策略中则以儿子为主
            options[key] = child[key] || parent[key]   //优先采用儿子，再采用父亲
        }
    }
    return options
}