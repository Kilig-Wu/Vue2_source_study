(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    var strats = {};
    var LIFECYCLE = ['beforeCerated', 'created'];
    LIFECYCLE.forEach(function (hook) {
      // {} {created: function() {}} => {created: [fn]}  一个mixin
      // {created: [fn]} {created: function() {}} => { created: [fn, fn] }  2个mixin
      //{ created: [fn, fn] } {created: function() {}} => { created: [fn, fn, fn] }  3个mixin
      strats[hook] = function (p, c) {
        if (c) {
          if (p) {
            return p.concat(c);
          } else {
            return [c];
          }
        } else {
          return p;
        }
      };
    });
    strats.components = function (parentVal, childVal) {
      var res = Object.create(parentVal);
      if (childVal) {
        for (var key in childVal) {
          res[key] = childVal[key]; //返回的是构造的对象， 可以拿到父亲原型上的属性 并且将儿子的都拷贝到自己的身上
        }
      }

      return res;
    };
    // strats.data = function() { //合并data
    // }
    // strats.computed = function() {
    // }
    // strats.watch = function() {
    // }
    function mergeOptions(parent, child) {
      var options = {};
      for (var key in parent) {
        mergeField(key);
      }
      for (var _key in child) {
        if (!parent.hasOwnProperty(_key)) {
          mergeField(_key);
        }
      }
      function mergeField(key) {
        //策略模式减少if/else(策略很多，因为生命周期很多)
        if (strats[key]) {
          options[key] = strats[key](parent[key], child[key]);
        } else {
          //如果不在策略中则以儿子为主
          options[key] = child[key] || parent[key]; //优先采用儿子，再采用父亲
        }
      }

      return options;
    }

    function initGlobalAPI(Vue) {
      //静态方法
      Vue.options = {
        _base: Vue
      };
      Vue.mixin = function (mixin) {
        //我们期望将用户的options和全局的options进行合并
        this.options = mergeOptions(this.options, mixin);
        return this;
      };

      //可以手动创建组件进行挂载
      Vue.extend = function (options) {
        function Sub() {
          var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
          //最终使用一个组件 就是new一个实例
          this._init(options); //默认对子类进行初始化操作
        }

        Sub.prototype = Object.create(Vue.prototype); //Sub.prototype.__proto__ = Vue.prototype   Sub继承Vue
        Sub.prototype.constructor = Sub; //Object.create创建的Sub.prototype会默认指向Sub的父类Vue
        Sub.options = mergeOptions(Vue.options, options); //保存用户传的选项
        return Sub;
      };
      Vue.options.components = {}; //全局指令 Vue.options.derectives
      Vue.component = function (id, definition) {
        //如果definition已经是一个函数了，说明用户自己调用了Vue.extend
        definition = typeof definition === 'function' ? definition : Vue.extend(definition);
        Vue.options.components[id] = definition;
      };
    }

    function _typeof(obj) {
      "@babel/helpers - typeof";

      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      }, _typeof(obj);
    }
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      Object.defineProperty(Constructor, "prototype", {
        writable: false
      });
      return Constructor;
    }
    function _slicedToArray(arr, i) {
      return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
    }
    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }
    function _iterableToArrayLimit(arr, i) {
      var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
      if (_i == null) return;
      var _arr = [];
      var _n = true;
      var _d = false;
      var _s, _e;
      try {
        for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);
          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"] != null) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }
      return _arr;
    }
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
      return arr2;
    }
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var id$1 = 0;
    //收集器
    var Dep = /*#__PURE__*/function () {
      function Dep() {
        _classCallCheck(this, Dep);
        this.id = id$1++; //
        this.subs = []; //存放属性对应的所有watcher（一个属性可以用在a组件， b组件， c组件）
      }
      //收集watcher
      _createClass(Dep, [{
        key: "depend",
        value: function depend() {
          //此法不行：不希望放重复的watcher，且只是单向关系（希望双向） dep->watcher
          // this.subs.push(Dep.target)

          Dep.target.addDep(this); //Dep.target是当前watcher。把当前dep传给了Watcher(让当前watcher记住dep)
        }
      }, {
        key: "addSub",
        value: function addSub(watcher) {
          this.subs.push(watcher); //dep记住watcher
        }
      }, {
        key: "notify",
        value: function notify() {
          this.subs.forEach(function (watcher) {
            return watcher.update();
          }); //告诉watcher要更新了
        }
      }]);
      return Dep;
    }();
    Dep.target = null;
    var stack = [];
    function pushTarget(watcher) {
      //渲染时，watcher入栈
      stack.push(watcher);
      Dep.target = watcher;
    }
    function popTarget() {
      //渲染完后watcher出栈,清空
      stack.pop();
      Dep.target = stack[stack.length - 1];
    }

    //重写数组中的部分方法
    var oldArrayProto = Array.prototype; //获取数组的原型

    //newArrayProto.__proto__ = oldArrayProto
    var newArrayProto = Object.create(oldArrayProto);
    var methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice'];
    methods.forEach(function (method) {
      newArrayProto[method] = function () {
        var _oldArrayProto$method;
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        //这里重写了数组的方法
        var result = (_oldArrayProto$method = oldArrayProto[method]).call.apply(_oldArrayProto$method, [this].concat(args)); //内部调用原来的方法（函数的劫持、切片编程）

        //我们需要对新增的数据再进行劫持
        var inserted;
        var ob = this.__ob__;
        switch (method) {
          case 'push':
          case 'unshift':
            //arr.unshift(1, 2, 3)
            inserted = args;
            break;
          case 'splice':
            //arr.splice(0, 1, { a: 1 }, {a: 1})
            inserted = args.slice(2);
            break;
        }
        if (inserted) {
          //如果有新增的内容，要对新增的内容再次进行观测
          ob.observeArray(inserted);
        }
        ob.dep.notify(); //数组变化了，通知对应的watcher更新

        return result;
      };
    });

    var Observer = /*#__PURE__*/function () {
      function Observer(data) {
        _classCallCheck(this, Observer);
        //给每个对象都增加收集功能
        this.dep = new Dep();

        //Object.defineProperty只能劫持已经存在的属性（删除新增的都没法，vue2里会单独写一些api $set $delete）
        Object.defineProperty(data, '__ob__', {
          //可枚举的话会进入死循环
          value: this,
          enumerable: false //将__ob__ 变成不可枚举（循环时无法获取到）
        });
        // data.__ob__ = this;  //给数据加了一个标识， 如果数据上有__ob__则说明这个属性被观测过了

        if (Array.isArray(data)) {
          //如果是数组的话，需要对数组新增的属性去做判断，并且对新增的属性进行观测
          //这里重写数组的方法（数组劫持的核心就是重写数组的方法，并且去观测数组中的每一项）
          data.__proto__ = newArrayProto; //需要保留数组原有的特性，并可以重写部分方法
          this.observeArray(data); //观测数组里的属性，如果数组里有对象，可以监控到对象的变化
        } else {
          this.walk(data);
        }
      }
      _createClass(Observer, [{
        key: "walk",
        value: function walk(data) {
          //循环对象，对属性依次劫持

          //“重新定义”属性-》性能差
          Object.keys(data).forEach(function (key) {
            return defineReactive(data, key, data[key]);
          });
        }
      }, {
        key: "observeArray",
        value: function observeArray(data) {
          data.forEach(function (item) {
            return observe(item);
          });
        }
      }]);
      return Observer;
    }(); //深层次嵌套会递归，递归多了性能差，不存在的属性性能差，存在的属性要重写方法（push, pop等）
    function dependArray(value) {
      for (var i = 0; i < value.length; i++) {
        //数组的每一项都依赖收集
        var current = value[i];
        current.__ob__ && current.__ob__.dep.depend();
        if (Array.isArray(current)) {
          dependArray(current);
        }
      }
    }
    function defineReactive(target, key, value) {
      //闭包 属性劫持
      var childOb = observe(value); //对所有的对象进行属性劫持（递归）,childOb.dep用来收集依赖的
      var dep = new Dep(); //每一个属性都有一个dep（收集器）
      Object.defineProperty(target, key, {
        get: function get() {
          //取值执行
          if (Dep.target) {
            dep.depend(); //让这个属性的收集器记住当前的watcher
            if (childOb) {
              childOb.dep.depend(); //让数组和对象也实现依赖收集（使用push等方法可以触发更新）
              if (Array.isArray(value)) {
                // arr: [1, 2, 3, { a:1}, ['a', 'b']],  给['a', 'b']添加依赖收集
                dependArray(value);
              }
            }
          }
          return value;
        },
        set: function set(newValue) {
          //修改执行
          if (newValue === value) return;
          observe(newValue);
          value = newValue;
          //观察者身份 Obverser，当数据变化后，会发送通知给Dep对象，也就是发布订阅模式中的时间中心（经纪人），然后又Dep 告诉订阅着 Watcher 对象， Watcher 便响应式地触发了 render重新渲染的过程。
          dep.notify(); //通知更新
        }
      });
    }

    function observe(data) {
      //对这个对象进行劫持

      if (_typeof(data) !== 'object' || data == null) {
        return; //只对对象进行劫持
      }
      /**
       * instanceof 用于检测构造函数的 prototype 属性是否出现在某个实例对象的原型链上。
       * 语法：object instanceof constructor [object：某个实例对象  constructor：某个构造函数]
       * **/
      if (data.__ob__ instanceof Observer) {
        //说明这个对象被代理过了
        return data.__ob__;
      }
      //如果一个对象被劫持过了，那就不需要再被劫持了（要判断一个对象是否被劫持过，可以添加一个实例，用实例来判断是否被劫持过）
      return new Observer(data);
    }

    var id = 0;
    //组件化好处：方便，复用，局部更新

    //1) 当我们创建渲染watcher的时候我们会把当前的渲染watcher方法Dep.target上
    //2)调用_render() 会取值 走到Object.defineProperty的get上
    var Watcher = /*#__PURE__*/function () {
      //每个组件都有自己的watcher new Watcher  exprOrfn: 表达式或函数
      function Watcher(vm, exprOrfn, options, cb) {
        _classCallCheck(this, Watcher);
        //vm: 当前watcher对应的是哪个实例 fn: 这个实例对应的渲染函数vm._update(vm._render())
        this.id = id++;
        this.renderWatcher = options; //是一个渲染watcher

        if (typeof exprOrfn === 'string') {
          this.getter = function () {
            return vm[exprOrfn];
          };
        } else {
          this.getter = exprOrfn; //getter意味着调用这个函数可以发生取值操作
        }

        this.deps = []; //watcher记住dep（以便实现计算属性、一些清理工作（组件卸载））
        this.depIds = new Set();
        this.lazy = options.lazy;
        this.cb = cb;
        this.dirty = this.lazy; //缓存值
        this.vm = vm;
        this.user = options.user; //标识是否是用户自己的watcher

        this.value = this.lazy ? undefined : this.get();
      }
      _createClass(Watcher, [{
        key: "addDep",
        value: function addDep(dep) {
          //一个组件对应多个属性，重复的属性不用记录
          var id = dep.id;
          if (!this.depIds.has(id)) {
            this.deps.push(dep);
            this.depIds.add(id);
            dep.addSub(this); //watcher记住了dep而且去重了，此时dep也记住了watcher
          }
        }
      }, {
        key: "evaluate",
        value: function evaluate() {
          this.value = this.get(); //获取到用户函数的返回值，并且标识为脏
          this.dirty = false;
        }
      }, {
        key: "get",
        value: function get() {
          // Dep.target = this; //静态属性  
          pushTarget(this); //静态属性；在渲染页面之前给dep添加watcher（会把当前的渲染watcher放到Dep.target上）

          var value = this.getter.call(this.vm); //渲染页面，会去vm上取值, vm._ipdate(vm._render)取name和age

          // Dep.target = null; //渲染完毕清空
          popTarget(); //渲染完毕清空 在渲染页面之后给dep取消watcher

          return value;
        }
      }, {
        key: "depend",
        value:
        //watcher里的depend就是让wahtcher中的dep去depend
        function depend() {
          var i = this.deps.length;
          while (i--) {
            //dep.depend()
            this.deps[i].depend(); //让计算属性watcher的dep也收集渲染watcher
          }
        }
      }, {
        key: "update",
        value: function update() {
          if (this.lazy) {
            //如果是计算属性,计算的值变化了 就标识计算属性是脏值了
            this.dirty = true;
          } else {
            queueWatcher(this); //把当前的watcher暂存
            // this.get(); //重新渲染
          }
        }
      }, {
        key: "run",
        value: function run() {
          var oldValue = this.value;
          var newValue = this.get();
          if (this.user) {
            this.cb.call(this.vm, newValue, oldValue);
          }
        }
      }]);
      return Watcher;
    }();
    var queue = [];
    var has = {};
    var pending = false; //防抖

    function flushSchedulerQueue() {
      var flushQueue = queue.splice(0); //拷贝一份queue
      queue = [];
      has = {};
      pending = false;
      flushQueue.forEach(function (q) {
        return q.run();
      }); //在属性过程中可能还有新的watcher,重新放到queue中
    }
    //异步更新
    function queueWatcher(watcher) {
      var id = watcher.id;
      if (!has[id]) {
        queue.push(watcher);
        has[id] = true;
        //不管update执行多少次，但是最终只执行一轮刷新操作(防抖)
        if (!pending) {
          nextTick(flushSchedulerQueue);
          pending = true;
        }
      }
    }

    //异步批处理，如果单纯的添加setTimeout会很耗性能
    var callbacks = [];
    var waiting = false;
    function flushCallbacks() {
      var cbs = callbacks.splice(0);
      waiting = false;
      callbacks = [];
      cbs.forEach(function (cb) {
        return cb();
      });
    }
    //nextTick没有直接使用某个api 而是采用优雅降级的方式
    //内部先采用的promise(ie不兼容) -》MutationObserver(h5的api) -》可以考虑ie专用的setImmediate -》setTimeout（优先级和效率排序）
    var timerFunc;
    if (Promise) {
      //可以把Promise转成字符串toString，判断是不是原生的Promise
      timerFunc = function timerFunc() {
        Promise.resolve().then(flushCallbacks); //vue3中直接使用这个，不兼容ie
      };
    } else if (MutationObserver) {
      var observer = new MutationObserver(flushCallbacks); //这里传入的回调时异步执行的
      var textNode = document.createTextNode(1); //监控文本的变化
      observer.observe(textNode, {
        characterData: true
      });
      timerFunc = function timerFunc() {
        textNode.textContent = 2; //文本变了执行flushCallbacks
      };
    } else if (setImmediate) {
      timerFunc = function timerFunc() {
        setImmediate(flushCallbacks);
      };
    } else if (setTimeout) {
      timerFunc = function timerFunc() {
        setTimeout(flushCallbacks);
      };
    }
    function nextTick(cb) {
      callbacks.push(cb); //维护nextTick中的callback方法
      if (!waiting) {
        timerFunc(); //最后一起刷新
        // setTimeout(() => { 
        //     flushCallbacks()  
        // }, 0);
        waiting = true;
      }
    }

    function initState(vm) {
      var opts = vm.$options; //获取所有的选项

      if (opts.data) {
        initData(vm);
      }
      if (opts.computed) {
        initComputed(vm);
      }
      if (opts.watch) {
        initWatch(vm);
      }
    }
    function initWatch(vm) {
      var watch = vm.$options.watch;
      for (var _key in watch) {
        var _handler = watch[_key]; //字符串、数组、函数、对象
        if (Array.isArray(_handler)) {
          for (var i = 0; i < _handler.length; i++) {
            createWatcher(vm, _key, _handler[i]);
          }
        } else {
          createWatcher();
        }
      }
    }
    function createWatcher() {
      //字符串 函数 对象（未处理对象）
      if (typeof handler === 'string') {
        handler = vm[handler]; //取methods里的方法
      }

      return vm.$watch(key, handler);
    }
    function proxy(vm, target, key) {
      Object.defineProperty(vm, key, {
        //vm.name
        get: function get() {
          return vm[target][key]; //vm._data.name
        },
        set: function set(newValue) {
          vm[target][key] = newValue;
        }
      });
    }
    function initData(vm) {
      var data = vm.$options.data; //data可能是函数和对象
      data = typeof data === 'function' ? data.call(vm) : data;
      vm._data = data;

      //数据劫持: vue2:defineProperty
      observe(data);

      //将vm._data用vm来代理
      for (var _key2 in data) {
        proxy(vm, '_data', _key2);
      }
    }
    function initComputed(vm) {
      var computed = vm.$options.computed;
      var watchers = vm._computedWatchers = {}; //vm._computedWatchers是为了在createComputedGetter函数中拿到watcher
      for (var _key3 in computed) {
        var userDef = computed[_key3];

        //需要监控计算属性的get方法(防止多次触发同一个)
        var getter = typeof userDef === 'function' ? userDef : userDef.get;
        watchers[_key3] = new Watcher(vm, getter, {
          lazy: true
        }); //lazy: true;->new Watcher时fn不会立即执行

        defineComputed(vm, _key3, userDef);
      }
    }
    function defineComputed(target, key, userDef) {
      var setter = userDef.set || function () {};
      Object.defineProperty(target, key, {
        get: createComputedGetter(key),
        set: setter
      });
    }
    //计算属性根本不会收集依赖，只会让自己的依赖去收集依赖
    function createComputedGetter(key) {
      //我们检测需要是否执行这个getter
      return function () {
        var watcher = this._computedWatchers[key]; //获取到对应属性的watcher
        if (watcher.dirty) {
          //如果是脏的，就执行用户传入的函数
          watcher.evaluate(); //求值后dirty变为false, 下次就不求值了
        }

        if (Dep.target) {
          //计算属性出栈后是否有渲染过程，如果有，我应该让计算属性watcher里的属性也去收集上一层watcher(渲染warcher)
          watcher.depend(); //不执行这一步的话，页面只是更新了计算属性的值 却不会重新渲染页面
        }

        return watcher.value; //最后返回的是watcher上的值
      };
    }

    function initStateMixin(Vue) {
      Vue.prototype.$nextTick = nextTick;

      //exprOrFn：表达式或  cb:回调   options：{ deep： ture }=>未处理
      Vue.prototype.$watch = function (exprOrFn, cb) {
        //firstname的值变化了 直接执行cb函数即可
        new Watcher(this, exprOrFn, {
          user: true
        }, cb);
      };
    }

    var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z]*";
    var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")");
    var startTagOpen = new RegExp("^<".concat(qnameCapture)); //匹配到的是一个开始标签名<div
    var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); //匹配到的是一个结束标签名</div
    var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; //匹配属性,第一个分组是属性的key value就是分组3/分组4/分组5
    var startTagClose = /^\s*(\/?)>/; //<div><br />  //开始标签的结束

    //解析html生成抽象dom树（也有解析html的包：htmlparser2）
    function parseHTML(html) {
      //html最开始肯定是<
      var ELEMENT_TYPE = 1;
      var TEXT_TYPE = 3;
      var stack = []; //用于存放元素
      var currentParent; //指向栈中最后一个
      var root; //当前树的根节点

      //最终需要转化成一颗抽象语法树（父元素下有子元素）
      function createASTElement(tag, attrs) {
        return {
          tag: tag,
          type: ELEMENT_TYPE,
          children: [],
          attrs: attrs,
          parent: null
        };
      }
      //利用栈型结构 来构造一棵树
      function start(tag, attrs) {
        var node = createASTElement(tag, attrs);
        if (!root) {
          //看一下是否是空树
          root = node; //如果为空则当前是树的根节点
        }

        if (currentParent) {
          node.parent = currentParent; //只赋予了parent属性
          currentParent.children.push(node); //还需要让父亲记住自己
        }

        stack.push(node);
        currentParent = node; //currentParent为栈中最后一个
      }

      function chars(text) {
        //文本直接放到当前指向的节点中
        text = text.replace(/\s/g, ''); //如果空格超过两个就删除两个以上的
        text && currentParent.children.push({
          type: TEXT_TYPE,
          text: text,
          parent: currentParent
        });
      }
      function end(tag) {
        stack.pop(); //弹出最后一个, 校验标签是否合法
        currentParent = stack[stack.length - 1];
      }
      function advance(n) {
        html = html.substring(n);
      }
      function parseStartTag() {
        var start = html.match(startTagOpen);
        if (start) {
          var match = {
            tagName: start[1],
            //标签名
            attrs: []
          };
          advance(start[0].length);

          //如果不是开始标签的结束,就一直匹配下去
          var attr, _end;
          while (!(_end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            advance(attr[0].length);
            match.attrs.push({
              name: attr[1],
              value: attr[3] || attr[4] || attr[5] || true
            }); //style的name,value需要去除空格
          }

          if (_end) {
            advance(_end[0].length);
          }
          return match;
        }
        return false; //不是开始标签
      }

      while (html) {
        //如果textEnd=0 说明是一个开始标签或者结束标签
        //如果textEnd>0 说明是文本的结束位置
        var textEnd = html.indexOf('<'); //如果indexOf的索引是0 则说明是个标签
        if (textEnd == 0) {
          var startTagMatch = parseStartTag();
          if (startTagMatch) {
            //解析到的开始标签
            start(startTagMatch.tagName, startTagMatch.attrs);
            continue;
          }
          var endTagMatch = html.match(endTag);
          if (endTagMatch) {
            //解析到的结束标签
            advance(endTagMatch[0].length);
            end(endTagMatch[1]);
            continue;
          }
        }
        if (textEnd > 0) {
          var text = html.substring(0, textEnd); //文本内容
          if (text) {
            chars(text);
            advance(text.length); //解析到的文本
          }
        }
      }

      return root;
    }

    function getProps(attrs) {
      var str = ''; //{name, value}
      for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (attr.name === 'style') {
          // color: red => { color: 'red' }
          attr.value = attr.value.split(';').reduce(function (target, item) {
            //qs库解析也行
            var _item$split = item.split(':'),
              _item$split2 = _slicedToArray(_item$split, 2),
              key = _item$split2[0],
              value = _item$split2[1];
            target[key] = value;
            return target;
          }, {});
        }
        str += "".concat(attr.name, ":").concat(JSON.stringify(attr.value), ",");
      }
      return "{".concat(str.slice(0, -1), "}"); //删除最后一个逗号
    }

    var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; //{{ aaa }}   //匹配到的内容就是表达式的变量
    function gen(node) {
      if (node.type === 1) {
        //是元素
        return codegen(node);
      } else {
        //文本
        var text = node.text;
        if (!defaultTagRE.test(text)) {
          return "_v(".concat(JSON.stringify(text), ")");
        } else {
          //_v(_s(name) + 'hello' + _s(name))
          var tokens = [];
          var match;
          defaultTagRE.lastIndex = 0; //exec捕获清零，重置位置
          var lastIndex = 0;
          while (match = defaultTagRE.exec(text)) {
            var index = match.index; //匹配到变量的位置{{name}} hello {{ age }} hello;
            if (index > lastIndex) {
              tokens.push(JSON.stringify(text.slice(lastIndex, index))); //得到通配符中间的文本
            }

            tokens.push("_s(".concat(match[1].trim(), ")"));
            lastIndex = index + match[0].length;
          }
          if (lastIndex < text.length) {
            //防止最后一个通配符后还有文本
            tokens.push(JSON.stringify(text.slice(lastIndex)));
          }
          return "_v(".concat(tokens.join('+'), ")");
        }
      }
    }
    function getChildren(children) {
      return children.map(function (child) {
        return gen(child);
      }).join(',');
    }
    function codegen(ast) {
      var children = getChildren(ast.children);
      var code = " _c('".concat(ast.tag, "', ").concat(ast.attrs.length > 0 ? getProps(ast.attrs) : 'null').concat(ast.children.length ? ",".concat(children) : '', ")");
      return code;
    }

    //vue3采用的不是正则
    function compileToFunction(template) {
      //1.就是将template转化成ast语法树
      var ast = parseHTML(template);

      //2.生成render方法（render方法执行后的返回结果就是虚拟Dom）
      //模板引擎的实现原理就是with + new Function
      var code = codegen(ast);
      code = "with(this){return ".concat(code, "}"); //with的用法
      var render = new Function(code); //根据代码生成render函数
      return render;
    }

    //h() _c()
    //是否原始标签（是组件还是原生标签）
    var isReservedTag = function isReservedTag(tag) {
      return ['a', 'div', 'p', 'button', 'ul', 'li', 'span'].includes(tag);
    };
    function createElementVNode(vm, tag) {
      var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      if (data == null) {
        data = {};
      }
      var key = data.key;
      if (key) {
        delete data.key;
      }
      for (var _len = arguments.length, children = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        children[_key - 3] = arguments[_key];
      }
      if (isReservedTag(tag)) {
        //原始标签
        return vnode(vm, tag, key, data, children);
      } else {
        //组件
        var Ctor = vm.$options.components[tag]; //组件的构造函数
        return createComponentVnode(vm, tag, key, data, children, Ctor);
      }
    }
    function createComponentVnode(vm, tag, key, data, children, Ctor) {
      if (_typeof(Ctor) === 'object') {
        //Vue.extend(Ctor)
        Ctor = vm.$options._base.extend(Ctor);
      }
      data.hook = {
        init: function init(vnode) {
          //稍后创造真实节点的时候 如果是组件调用此init方法
          //保存组件的实例到虚拟节点上
          var instance = vnode.componentInstance = new vnode.componentOptions.Ctor();
          instance.$mount(); //instance.$el
        }
      };

      return vnode(vm, tag, key, data, children, null, {
        Ctor: Ctor
      });
    }

    //_v()
    function createTextVNode(vm, text) {
      return vnode(vm, undefined, undefined, undefined, undefined, text);
    }

    //ast做的是语法的转化 描述的是语法本身（可以描述js css html）
    //我们的虚拟dom 是描述dom元素，可以增加一些自定义属性（描述dom的）
    function vnode(vm, tag, key, data, children, text, componentOptions) {
      return {
        vm: vm,
        tag: tag,
        key: key,
        data: data,
        children: children,
        text: text,
        componentOptions: componentOptions //包含组件的构造函数
      };
    }

    //判断两节点是否同一节点
    function isSameVNode(vnode1, vnode2) {
      return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key;
    }

    function createComponent(vnode) {
      var i = vnode.data;
      if ((i = i.hook) && (i = i.init)) {
        i(vnode); //初始化组件,找到init方法
      }

      if (vnode.componentInstance) {
        return true; //说明是组件
      }
    }

    function createElm(vnode) {
      var tag = vnode.tag,
        data = vnode.data,
        children = vnode.children,
        text = vnode.text;
      if (typeof tag === 'string') {
        //标签

        //创建真实元素 也要判断是组件还是元素
        if (createComponent(vnode)) {
          //组件 vnode.componentInstance.$el
          return vnode.componentInstance.$el;
        }
        vnode.el = document.createElement(tag); //这里将真实节点和虚拟节点对应起来，后续如果修改了（属性等），可以直接找到虚拟节点对应的真实节点来进行修改

        patchProps(vnode.el, {}, data); //更新属性
        children.forEach(function (child) {
          vnode.el.appendChild(createElm(child));
        });
      } else {
        //文本
        vnode.el = document.createTextNode(text);
      }
      return vnode.el;
    }

    //设置属性
    function patchProps(el) {
      var oldProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      // 老的样式中有 新的没有，需要删除老的
      var oldStyles = oldProps.style || {};
      var newStyles = props.style || {};
      for (var key in oldStyles) {
        if (!newStyles[key]) {
          el.style[key] = '';
        }
      }
      for (var _key in oldProps) {
        //老的属性有新的没有
        if (!props[_key]) {
          el.removeAttribute(_key);
        }
      }
      for (var _key2 in props) {
        //用新的覆盖老的
        if (_key2 === 'style') {
          //如果是样式
          for (var styleName in props.style) {
            el.style[styleName] = props.style[styleName];
          }
        } else {
          el.setAttribute(_key2, props[_key2]);
        }
      }
    }
    function patch(oldVNode, vnode) {
      if (!oldVNode) {
        //oldVNode不存在就是组件的挂载
        return createElm(vnode); //$vm.$el就是组件渲染的结果
      }
      //
      var isRealElement = oldVNode.nodeType; //nodeType为dom原生方法
      //是否真实元素
      if (isRealElement) {
        var elm = oldVNode;
        var parentElm = elm.parentNode; //获取父元素
        var newElm = createElm(vnode); //新dom
        parentElm.insertBefore(newElm, elm.nextSibling); //把新生成的节点插入到老节点后面 insertBefore(newNode, referenceNode) 方法在参考节点之前插入一个拥有指定父节点的子节点  nextSibling 属性可返回某个元素之后紧跟的元素
        parentElm.removeChild(elm); //删除老节点

        return newElm; //返回新dom
      } else {
        //diff算法
        //1.两个节点不是同一个节点，直接删除老的换上新的
        //2.两个节点是同一个节点（判断节点的tag和key）,比较两个节点的属性是否有差异（复用老的节点 ，将差异的属性更新）
        //3.节点比较完毕后就需要比较两人的儿子

        patchVNode(oldVNode, vnode);
      }
    }
    function patchVNode(oldVNode, vnode) {
      //不相同节点
      if (!isSameVNode(oldVNode, vnode)) {
        //两节点不是同一节点， 用老节点的父亲进行替换
        var _el = createElm(vnode);
        oldVNode.el.parentNode.replaceChild(_el, oldVNode.el);
        return _el;
      }

      //相同节点
      var el = vnode.el = oldVNode.el; //复用老节点的元素
      //是文本
      if (!oldVNode.tag) {
        if (oldVNode.text !== vnode.text) {
          el.textContent = vnode.text; //用新文本替换老的
        }
      }
      //是标签   需要比较标签的属性   vnode.data-新标签的属性    oldVNode.data-老标签的属性
      patchProps(el, oldVNode.data, vnode.data);

      //比儿子节点（1.一方有儿子，一方没儿子2.两方都有儿子）
      var newChildren = oldVNode.children || [];
      var oldChildren = vnode.children || [];
      if (oldChildren.length > 0 && newChildren.length > 0) {
        //两个都有儿子，比较两人的儿子
        updateChildren(el, oldChildren, newChildren);
      } else if (newChildren.length > 0) {
        //老的没有儿子， 新的有儿子（把新的儿子放老的里面）
        mountChildren(el, newChildren);
      } else if (oldChildren.length > 0) {
        //老的有儿子， 新的没有儿子（把老的儿子都删了）
        el.innerHTML = ''; //innerHTML不太安全（此处是为了方便），可以循环删除
      }

      return el;
    }
    function mountChildren(el, newChildren) {
      for (var i = 0; i < newChildren.length; i++) {
        var child = newChildren[i];
        el.appendChild(createElm(child));
      }
    }
    function updateChildren(el, oldChildren, newChildren) {
      //vue2中采用双指针的方式比较两个节点
      var oldStartIndex = 0;
      var newStartIndex = 0;
      var oldEndIndex = oldChildren.length - 1;
      var newEndIndex = newChildren.length - 1;
      var oldStartVnode = oldChildren[0];
      var newStartVnode = newChildren[0];
      var oldEndVnode = oldChildren[oldEndIndex];
      var newEndVnode = newChildren[newEndIndex];
      function makeIndexByKey(children) {
        var map = {}; //key和索引的映射
        children.forEach(function (child, index) {
          map[child.key] = index;
        });
        return map;
      }
      var map = makeIndexByKey(oldChildren);
      while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        //双方有一方头指针大于尾指针则停止循环
        if (!oldStartVnode) {
          //1
          oldStartVnode = oldChildren[++oldStartIndex];
        } else if (!oldEndVnode) {
          //1
          oldEndVnode = oldChildren[--oldEndIndex];
        } else if (isSameVNode(oldStartVnode, newStartVnode)) {
          //从前往后比 abcd -> abcde
          patchVNode(oldStartVnode, newStartVnode); //如果相同，则递归比较字节点
          oldStartVnode = oldChildren[++oldStartIndex];
          newStartVnode = newChildren[++newStartIndex];
        } else if (isSameVNode(oldEndVnode, newEndVnode)) {
          //从后往前比 abcd -> eabcd
          patchVNode(oldEndVnode, newEndVnode); //如果相同，则递归比较字节点
          oldEndVnode = oldChildren[--oldEndIndex];
          newEndVnode = newChildren[--newEndIndex];
        } else if (isSameVNode(oldEndVnode, newStartVnode)) {
          //
          //交叉比 abcd -> dcba
          patchVNode(oldEndVnode, newStartVnode); //如果相同，则递归比较字节点
          el.insertBefore(oldEndVnode.el, oldStartVnode.el);
          oldEndVnode = oldChildren[--oldEndIndex];
          newStartVnode = newChildren[++newStartIndex];
        } else if (isSameVNode(oldStartVnode, newEndVnode)) {
          //
          //交叉比 dcba -> abcd
          patchVNode(oldStartVnode, newEndVnode); //如果相同，则递归比较字节点
          el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
          oldStartVnode = oldChildren[++oldStartIndex];
          newEndVnode = newChildren[--newEndIndex];
        } else {
          //乱序比对（根据老的列表做一个映射关系）abcd -> bmapcq
          var moveIndex = map[newStartVnode.key];
          if (moveIndex !== undefined) {
            var moveVnode = oldChildren[mapIndex]; //找到对应的虚拟节点复用
            el.insertBefore(moveVnode.el, oldStartVnode.el);
            oldChildren[moveIndex] = undefined; //表示这个节点已经移走了(会导致添加1处的判断)
            patchVNode(moveVnode, newStartVnode); //比对属性和节点
          } else {
            el.insertBefore(createElm(newStartVnode), oldStartVnode.el);
          }
          newStartVnode = newChildren[++newStartIndex]; //新列表开始指针不停后移
        }

        if (newStartIndex <= newEndIndex) {
          //新的多余的就新增的插入进去
          for (var i = newStartIndex; i <= newEndIndex; i++) {
            var chidEl = createElm(newChildren[i]);
            //可能向前可能向后追加
            var anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null; //获取下一个元素
            el.insertBefore(chidEl, anchor); //anchor为null的时候则会认为是appendchild
          }
        }

        if (oldStartIndex <= oldEndIndex) {
          //老的多余的就删除多余的老的
          for (var _i = oldStartIndex; _i <= oldEndIndex; _i++) {
            if (oldChildren[_i]) {
              //1
              var childEl = oldChildren[_i].el;
              el.removeChild(childEl);
            }
          }
        }
      }
    }

    function initLifeCycle(Vue) {
      Vue.prototype._update = function (vnode) {
        //将vnode装化成真实dom
        var vm = this;
        var el = vm.$el;
        var preVnode = vm._vnode;
        vm._vnode = vnode; //把组件第一次产生的虚拟节点保存到vnode上
        if (preVnode) {
          //有的化表示之前渲染过了
          vm.$el = patch(preVnode, vnode); //diff算法执行 preVnode和vnode比对
        } else {
          vm.$el = patch(el, vnode);
        }

        //patch既有初始化的功能,又有更新的功能
      };
      //_c('div', {}, ...children)
      Vue.prototype._c = function () {
        return createElementVNode.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
      };
      //_v(text)
      Vue.prototype._v = function () {
        return createTextVNode.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
      };
      Vue.prototype._s = function (value) {
        if (_typeof(value) !== 'object') return value;
        return JSON.stringify(value);
      };
      Vue.prototype._render = function () {
        //call让with中的this指向vm
        //当渲染时会去实例中取值，我们就可以将属性和试图绑定在一起
        return this.$options.render.call(this); //通过ast语法转义生成的render方法
      };
    }

    function mountComponent(vm, el) {
      //这里的el是通过querySelector处理过的
      vm.$el = el;
      //1.调用render方法产生虚拟节点，虚拟dom
      // vm._update(vm._render());  //vm.$options.render()->返回虚拟节点
      var updateComponent = function updateComponent() {
        //updateComponent渲染页面
        vm._update(vm._render()); //vm.$options.render()->返回虚拟节点
      };

      new Watcher(vm, updateComponent, true); //true用于标识是一个渲染watcher

      //2.根据虚拟Dom产生真实Dom

      //3.插入到el元素中
    }

    //vue核心流程 创造了响应式数据 -> 模板转化成了ast语法树 -> 将ast语法树转换了render函数 -> 后续每次数据更新可以只执行render函数，无需再执行ast转化的过程

    //render函数会去产生虚拟节点（使用响应式数据）
    //根据虚拟的节点创造真实的Dom

    function callHook(vm, hook) {
      var handlers = vm.$options[hook];
      if (handlers) {
        handlers.forEach(function (handler) {
          return handler.call(vm);
        });
      }
    }

    function initMixin(Vue) {
      Vue.prototype._init = function (options) {
        //初始化操作
        var vm = this;
        //this.constructor = Vue, 将Vue.options和用户的options合并
        //定义的全局指令和过滤器..都会挂载到实例上(this.constructor可能是子组件)
        vm.$options = mergeOptions(this.constructor.options, options); //将用户的选项挂在原型实例上，防止其他原型属性上需要options

        callHook(vm, 'beforeCreate');
        //初始化状态（状态包括props,watch,computed等。。）
        initState(vm);
        callHook(vm, 'created');
        if (options.el) {
          vm.$mount(options.el); //实现数据的挂载
        }
      };

      Vue.prototype.$mount = function (el) {
        var vm = this;
        el = document.querySelector(el);
        var ops = vm.$options;
        if (!ops.render) {
          //先查找有没有render函数
          var template;
          if (!ops.template && el) {
            //没有写模板 但是写了el
            //没有render看一下是否写了template,没写template采用外部的template
            template = el.outerHTML;
          } else {
            template = ops.template;
          }
          //写了template就用写了的template
          if (template) {
            //需要对模板进行编译
            var render = compileToFunction(template);
            ops.render = render; //jsx最终会编译成h('xxx')
          }
        }

        mountComponent(vm, el); //组件的挂载
        //最终可以获取render方法

        //script标签引用的vue.global.js,整个编译过程是在浏览器运行的
        //runtime(运行时)是不包含模板编译的，整个编译过程是打包的时候通过loader来转义.vue文件的，用runtime的时候不能使用template
      };
    }

    // class Vue {}   //使用类方法创建会将所有方法耦合在一起。所以Vue使用构造函数扩展方法（Vue.prototype.a = ），把扩展的功能放到不同的文件方便管理
    function Vue(options) {
      this._init(options); //默认调用init
    }

    initMixin(Vue); //扩展了init方法
    initLifeCycle(Vue);
    initGlobalAPI(Vue);
    initStateMixin(Vue);

    return Vue;

}));
//# sourceMappingURL=vue.js.map
