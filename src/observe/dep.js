let id = 0;
//收集器
class Dep {
    constructor() {
        this.id = id++;  //
        this.subs = []  //存放属性对应的所有watcher（一个属性可以用在a组件， b组件， c组件）
    }
    //收集watcher
    depend() {
        //此法不行：不希望放重复的watcher，且只是单向关系（希望双向） dep->watcher
        // this.subs.push(Dep.target)

        Dep.target.addDep(this) //Dep.target是当前watcher。把当前dep传给了Watcher(让当前watcher记住dep)
    };
    addSub(watcher) {
        this.subs.push(watcher) //dep记住watcher
    };
    notify() {
        this.subs.forEach(watcher => watcher.update()) //告诉watcher要更新了
    }
}
Dep.target = null;

let stack = [];
export function pushTarget(watcher) {  //渲染时，watcher入栈
    stack.push(watcher);
    Dep.target = watcher;
}
export function popTarget() {  //渲染完后watcher出栈,清空
    stack.pop();
    Dep.target = stack[stack.length - 1]
}

export default Dep