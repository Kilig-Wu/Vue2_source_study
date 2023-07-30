// class Vue {}   //使用类方法创建会将所有方法耦合在一起。所以Vue使用构造函数扩展方法（Vue.prototype.a = ），把扩展的功能放到不同的文件方便管理
import { initGlobalAPI } from './globalAPI'
import { initMixin } from './init'
import { initLifeCycle } from './lifecycle'
import { initStateMixin } from './state'

function Vue(options) {  
    this._init(options)  //默认调用init
}
initMixin(Vue)  //扩展了init方法
initLifeCycle(Vue)
initGlobalAPI(Vue)
initStateMixin(Vue)



export default Vue