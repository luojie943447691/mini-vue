'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// 实现 emit 
function emit(instance, event) {
    var payload = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        payload[_i - 2] = arguments[_i];
    }
    var props = instance.props;
    // 开头大写
    var capitalize = function (str) {
        return str[0].toUpperCase() + str.slice(1);
    };
    // 烤串转驼峰
    // var kebabToHump = (str:string) =>{
    //     // exec 必须要全局 不然要死循环
    //     const reg = /(?<=-)\w/g
    //     let temp;
    //     // 
    //     while(temp = reg.exec(str)){
    //         str = str.slice(0,temp.index-1) + temp[0].toUpperCase() + str.slice(temp.index + 1)
    //     }
    //     return  str
    // }
    var kebabToHump = function (str) {
        return str.replace(/-(\w)/g, function (_, s) {
            return s ? s.toUpperCase() : "";
        });
    };
    // 组装 name 
    var toHandlerKey = function (str) {
        return str ? 'on' + capitalize(kebabToHump(str)) : '';
    };
    var evnetName = toHandlerKey(event);
    // 获取到 props 
    var eventFn = props[evnetName];
    if (eventFn) {
        eventFn.apply(instance.proxy, payload);
    }
}

var isObject = function (value) {
    return value !== null && typeof value === 'object';
};
var hasOwn = function (target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
};

// 用于收集依赖 收集的是什么依赖呢？
//     收集的是 当前 effect 传入的 fn 作为依赖，需要注意的是 fn 可能会传递多个相同的，所以我们要使用 weakMap或者Set
var targetMap = new WeakMap();
// 用于触发之前收集到的 fn 
function trigger(target, key) {
    // 获取 target 对应的 weakMap 的值
    var targetMapValue = targetMap.get(target); // Set
    if (!targetMapValue)
        return;
    // 取出之前已经收集好的 key 对应的 Set 里面保存的 fn ，存的是一个数组
    var deps = targetMapValue.get(key);
    triggerEffect(deps);
}
// 触发函数
function triggerEffect(deps) {
    for (var _i = 0, deps_1 = deps; _i < deps_1.length; _i++) {
        var fnObj = deps_1[_i];
        // 判断是否有 scheduler 
        if (fnObj.schduler) {
            fnObj.schduler();
        }
        else {
            fnObj.run();
        }
    }
}

var get = createGetter();
var set = createSetter();
var readOnlyGet = createGetter(true);
var shallowReadOnlyGet = createGetter(true, true);
// isReadOnly 只读 ，isShallow 深浅 true 表示浅
function createGetter(isReadOnly, isShallow) {
    if (isReadOnly === void 0) { isReadOnly = false; }
    if (isShallow === void 0) { isShallow = false; }
    return function get(target, key) {
        // 指定一个 key ，访问这个键的时候返回这个对象是否是 reactive 对象
        //     只要不是 isReadOnly 就是响应式对象
        if (key === "__v_isReative" /* IS_REACTIVE */) {
            return !isReadOnly;
        }
        else if (key === "__v_isReadOnly" /* IS_READONLY */) {
            return isReadOnly;
        }
        var res = Reflect.get(target, key);
        // 浅
        if (!isShallow) {
            // 看看 res 是否是 object ，是的话就变成 响应式对象/只读对象
            if (isObject(res)) {
                return isReadOnly ? readOnly(res) : reactive(res);
            }
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        var res = Reflect.set(target, key, value);
        // TODO 触发依赖
        trigger(target, key);
        return res;
    };
}
// 处理 reactive 的
var mutationHandlers = {
    // 比如 raw = {foo:1}
    // target 为 {foo:1}
    // key 为我们将要取的key 这里就以 foo 为例
    get: get,
    set: set
};
// 处理 readOnly 的
var readOnlyHandler = {
    get: readOnlyGet,
    set: function (target, key, value) {
        console.warn("".concat(key.toString(), "\u662F\u53EA\u8BFB\u5C5E\u6027\uFF0C\u4E0D\u80FD\u4FEE\u6539\uFF01"));
        return true;
    }
};
// 处理浅只读
// export const shallowReadOnlyHandler = extend({},readOnlyHandler,{get:shallowReadOnlyGet})
var shallowReadOnlyHandler = {
    get: shallowReadOnlyGet,
    set: function (target, key, value) {
        console.warn("".concat(key.toString(), "\u662F\u53EA\u8BFB\u5C5E\u6027\uFF0C\u4E0D\u80FD\u4FEE\u6539\uFF01"));
        return true;
    }
};

function reactive(raw) {
    // 注意  在es5中 不支持 Proxy，所以需要我们去配置 tsconfig 的 lib 
    return createActiveObject(raw, mutationHandlers);
}
// 深只读方法
function readOnly(raw) {
    return createActiveObject(raw, readOnlyHandler);
}
// 浅只读方法
function shallowReadOnly(raw) {
    return createActiveObject(raw, shallowReadOnlyHandler);
}
function createActiveObject(raw, baseHandlers) {
    return new Proxy(raw, baseHandlers);
}

// 初始化 props 
function initProps(instance, props) {
    // 如果 instance.vnode.props 存在
    if (instance.vnode.props) {
        instance.props = shallowReadOnly(props || {});
    }
}

var publicPropertiesMap = {
    $el: function (i) { return i.vnode.el; }
};
var PublicInstanceProxyHandler = {
    get: function (_a, key, receiver) {
        var instance = _a.instance;
        var setupState = instance.setupState, props = instance.props; instance.el;
        // 如果访问的是 $el 、 $data 、 $props 等，则返回相应的数据
        if (hasOwn(publicPropertiesMap, key)) {
            return publicPropertiesMap[key](instance);
        }
        else if (hasOwn(props, key)) {
            return Reflect.get(props, key);
        }
        else if (key in setupState) {
            return Reflect.get(setupState, key);
        }
    },
    set: function (target, key, newValue, receiver) {
        return true;
    }
};

// 创建组件实例 
function createComponentInstance(vnode) {
    var component = {
        vnode: vnode,
        type: vnode.type,
        setupState: {},
        props: {},
    };
    return component;
}
function setupComponent(instance) {
    // TODO 
    initProps(instance, instance.vnode.props);
    //  initSlots()
    setupStatefulComponent(instance);
}
// 初始化一个有状态的 component
function setupStatefulComponent(instance) {
    var Component = instance.type;
    // 这里需要做很多数据的代理 所以做了抽离 比如 $el $data $props
    instance.proxy = new Proxy({ instance: instance }, PublicInstanceProxyHandler);
    var setup = Component.setup;
    var props = instance.props;
    if (setup) {
        // 传递 props 
        var setupResult = setup(props, { emit: emit.bind(null, instance) }); // 开发小技巧，柯里化
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    var Component = instance.type;
    // if(Component.render){
    instance.render = Component.render;
    // }
}

function render(vnode, container) {
    // console.log('vnode1',vnode);
    // patch
    patch(vnode, container);
}
function patch(vnode, container) {
    // 去处理组件
    // 判断是 element 还是 componnet 类型
    // const { shapFlag } = vnode
    if (typeof vnode.type === 'object') {
        // if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
    }
    else if (typeof vnode.type === 'string') {
        // else if (shapFlag & ShapFlags.ELEMENT) {
        processElement(vnode, container);
    }
}
// 处理组件
function processComponent(vnode, container) {
    // 挂载组件
    mountComponent(vnode, container);
}
// 处理 element 
function processElement(vnode, container) {
    // 挂载 element
    mountElement(vnode, container);
}
// 挂载 element 
function mountElement(vnode, container) {
    var el = (vnode.el = document.createElement(vnode.type));
    // 获取 children 
    var children = vnode.children, props = vnode.props;
    // const { shapFlag } = vnode
    // 判断是 string 还是 Array
    if (Array.isArray(children)) {
        // if (shapFlag & ShapFlags.ARRAY_CHILDREN) {
        mountChildren(vnode, el);
    }
    else if (typeof children === 'string') {
        // else if(shapFlag & ShapFlags.TEXT_CHILDREN){
        el.textContent = vnode.children;
    }
    // 属性更新到节点上 
    for (var key in props) {
        // 判断是否是 on 开头
        if (key.startsWith("on")) {
            var eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, props[key]);
        }
        else {
            // 获取 val 
            var val = props[key];
            el.setAttribute(key, val);
        }
    }
    // 添加元素
    insert(el, container);
}
// 挂载子节点 
function mountChildren(vnode, container) {
    vnode.children.forEach(function (v) {
        patch(v, container);
    });
}
// 挂载组件
function mountComponent(initialvnode, container) {
    // 创建组件实例 
    var instance = createComponentInstance(initialvnode);
    // console.log('instance', instance);
    // 这里面设置了响应式对象 + proxy + props 等重要数据
    setupComponent(instance);
    setupRenderEffect(instance, initialvnode, container);
}
function setupRenderEffect(instance, initialvnode, container) {
    // 取到 proxy 对象
    var proxy = instance.proxy; instance.props;
    var subTree = instance.render.call(proxy);
    // initialvnode -> path
    // initialvnode -> element -> mountElement
    patch(subTree, container);
    // 以上代码执行完成之后 就代表所有节点都已经打补丁了， 
    // 此时 subTree 是根节点也就是 App.js render 返回节点生成的实例
    initialvnode.el = subTree.el;
}
// 添加元素
function insert(el, parent, anchor) {
    if (anchor === void 0) { anchor = null; }
    parent.insertBefore(el, anchor);
}

function createVnode(type, props, children) {
    var vnode = {
        type: type,
        props: props,
        children: children,
        // shapFlag:getShapFlag(type),
        el: null
    };
    // children
    // if(typeof children === 'string'){
    //     vnode.shapFlag |= ShapFlags.TEXT_CHILDREN
    // }else if(Array.isArray(children)){
    //     vnode.shapFlag |= ShapFlags.ARRAY_CHILDREN
    // }
    return vnode;
}
// 获取节点类型
// export function getShapFlag (type){
//     return typeof type === 'string' ? ShapFlags.ELEMENT: ShapFlags.STATEFUL_COMPONENT
// }

function createApp(rootComponent) {
    return {
        mount: function (rootContainer) {
            // 先转 vnode
            // component => vnode
            // 所有逻辑都是基于虚拟节点的
            var vnode = createVnode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, chidren) {
    return createVnode(type, props, chidren);
}

exports.createApp = createApp;
exports.h = h;
