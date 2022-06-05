'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVnode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
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
function createTextVNode(text) {
    return createVnode(Text, {}, text);
}

function h(type, props, chidren) {
    return createVnode(type, props, chidren);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (typeof slot === 'function') {
        return createVnode(Fragment, {}, slot(props));
    }
    if (slot)
        return createVnode("div", {}, slot);
}

const extend = Object.assign;
const isObject = (value) => {
    return value !== null && typeof value === 'object';
};
const hasChanged = (value, newValue) => {
    return !Object.is(value, newValue);
};
const hasOwn = (target, key) => {
    return Object.prototype.hasOwnProperty.call(target, key);
};
// 开头大写
const capitalize = (str) => {
    return str[0].toUpperCase() + str.slice(1);
};
const kebabToHump = (str) => {
    return str.replace(/-(\w)/g, (_, s) => {
        return s ? s.toUpperCase() : "";
    });
};

// 当前活跃对象 
let activeEffect;
// 是否收集依赖 只需要收集一次就行
let shouldTrack = false;
class ReactiveEffect {
    constructor(fn, schduler) {
        this.fn = fn;
        this.schduler = schduler;
        this.deps = [];
        // 没有被清空 对应视频里面的 active 
        this.notClean = true;
        this.fn = fn;
        this.schduler = schduler;
    }
    // 本质是在这里收集的依赖 
    run() {
        // activeEffect = this;
        // return this.fn()
        // 如果已经被清空过，则没有必要再次收集依赖
        if (!this.notClean) {
            return this.fn();
        }
        // 
        shouldTrack = true;
        activeEffect = this;
        const result = this.fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        // 只要清空过一次 就不需要清空了
        if (this.notClean) {
            // 删除 effect 的函数
            cleanUpEffect(this);
            // 执行 onStop 方法
            if (this.onStop) {
                this.onStop();
            }
            this.notClean = false;
        }
    }
}
// 删除 effect 的函数
function cleanUpEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
// 用于收集依赖 收集的是什么依赖呢？
//     收集的是 当前 effect 传入的 fn 作为依赖，需要注意的是 fn 可能会传递多个相同的，所以我们要使用 weakMap或者Set
const targetMap = new WeakMap();
function track(target, key) {
    if (!isTracking())
        return;
    /* 对象如下
    {
        [target]:{
            [key]:[x,x,xx,x,x]
        }
    }
    */
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    // 如果不存在
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap); // ** 为什么 ？？？？
    }
    let deps = depsMap.get(key);
    if (!deps) {
        // 第一次这是错误的  应该使用下面的方式
        // deps = []; // ** 这里为什么不用 [] 数组呢？ （当时的疑问已解决）
        // ** 为什么又不需要  set(target,depsMap) 了呢？ 等待后续解决  （确实第一次代码出错 也修正了）
        deps = new Set(); // 用 Set 是因为可以自动去重
        depsMap.set(key, deps);
    }
    trackEffect(deps);
}
function isTracking() {
    // 如果我们的对象没有执行 effect 的话，是没有 activeEffect 的，所以得判断一下，如我们的 reactive.test.ts 
    return shouldTrack && activeEffect !== undefined;
    // return activeEffect !== undefined
}
function trackEffect(deps) {
    if (deps.has(activeEffect))
        return;
    deps.add(activeEffect);
    // 记录当前活跃对象的副作用函数数组
    activeEffect.deps.push(deps);
}
// 用于触发之前收集到的 fn 
function trigger(target, key) {
    // 获取 target 对应的 weakMap 的值
    const targetMapValue = targetMap.get(target); // Set
    if (!targetMapValue)
        return;
    // 取出之前已经收集好的 key 对应的 Set 里面保存的 fn ，存的是一个数组
    const deps = targetMapValue.get(key);
    triggerEffect(deps);
}
// 触发函数
function triggerEffect(deps) {
    for (const fnObj of deps) {
        // 判断是否有 scheduler 
        if (fnObj.schduler) {
            fnObj.schduler();
        }
        else {
            fnObj.run();
        }
    }
}
function effect(fn, options = {}) {
    // const schduler = options.scheduler;
    // const _effect = new ReactiveEffect(fn,schduler)
    const _effect = new ReactiveEffect(fn, options === null || options === void 0 ? void 0 : options.scheduler);
    // _effect.onStop = options.onStop;
    // 优化上边的代码 因为后续可能会有多个数据
    // Object.assign(_effect,options)
    extend(_effect, options);
    if (!options.lazy) {
        _effect.run();
    }
    const runner = _effect.run.bind(_effect);
    // ** 注意这里 很厉害的写法
    runner.effect = _effect;
    return runner; // 处理this指向问题
    // fn()
}

const get = createGetter();
const set = createSetter();
const readOnlyGet = createGetter(true);
const shallowReadOnlyGet = createGetter(true, true);
// isReadOnly 只读 ，isShallow 深浅 true 表示浅
function createGetter(isReadOnly = false, isShallow = false) {
    return function get(target, key) {
        // 指定一个 key ，访问这个键的时候返回这个对象是否是 reactive 对象
        //     只要不是 isReadOnly 就是响应式对象
        if (key === "__v_isReative" /* IS_REACTIVE */) {
            return !isReadOnly;
        }
        else if (key === "__v_isReadOnly" /* IS_READONLY */) {
            return isReadOnly;
        }
        const res = Reflect.get(target, key);
        // 浅
        if (!isShallow) {
            // 看看 res 是否是 object ，是的话就变成 响应式对象/只读对象
            if (isObject(res)) {
                return isReadOnly ? readOnly(res) : reactive(res);
            }
            if (!isReadOnly) {
                // TODO 收集依赖
                track(target, key);
            }
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // TODO 触发依赖
        trigger(target, key);
        return res;
    };
}
// 处理 reactive 的
const mutationHandlers = {
    // 比如 raw = {foo:1}
    // target 为 {foo:1}
    // key 为我们将要取的key 这里就以 foo 为例
    get,
    set
};
// 处理 readOnly 的
const readOnlyHandler = {
    get: readOnlyGet,
    set(target, key, value) {
        console.warn(`${key.toString()}是只读属性，不能修改！`);
        return true;
    }
};
// 处理浅只读
// export const shallowReadOnlyHandler = extend({},readOnlyHandler,{get:shallowReadOnlyGet})
const shallowReadOnlyHandler = {
    get: shallowReadOnlyGet,
    set(target, key, value) {
        console.warn(`${key.toString()}是只读属性，不能修改！`);
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

// 如何监听单值 比如 1 "a" true 这样的数据发生变化呢？ 也就是 set get
// 针对对象我们可以用 Proxy，但是单值没有办法，所以就使用了 Ref 
// 将单值转换成对象的形式 也就是 RefImpl 实例对象，当我们 get value 的时候追踪依赖，set value 的时候触发依赖 
class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // 没有被修饰过的数据
        this._rawValue = value;
        // 看看 value 是否是对象 
        this._value = convert(value);
        this.deps = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 如果相等 ，并且对比的时候需要两个普通的对象对比
        if (!hasChanged(this._rawValue, newValue))
            return;
        this._rawValue = newValue;
        this._value = convert(newValue);
        // 先修改值 再通知
        triggerEffect(this.deps);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        // 收集依赖 
        trackEffect(ref.deps);
    }
}
const ref = (value) => {
    return new RefImpl(value);
};
// isRef 是否是 ref 类型
const isRef = (ref) => {
    return !!ref.__v_isRef;
};
const unRef = (ref) => {
    // 看看是不是 ref 对象，是的话就返回值
    // return isRef(ref) ? ref._rawValue : ref // 这里错的离谱 啊啊啊 
    return isRef(ref) ? ref.value : ref;
};
const proxyRefs = (objectWithRef) => {
    return new Proxy(objectWithRef, {
        get(target, key) {
            // 判断数据是否是 ref 
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value, receiver) {
            // const oldValue = Reflect.get(target,key,receiver)
            // if(unRef(oldValue) === unRef(newValue))return true;
            // const shouldValue = isRef(oldValue) && !isRef(newValue)? ref(newValue) :newValue
            // return Reflect.set(target,key, shouldValue,receiver)
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
};

// 实现 emit 
function emit(instance, event, ...payload) {
    const { props } = instance;
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
    // 组装 name 
    const toHandlerKey = (str) => {
        return str ? 'on' + capitalize(kebabToHump(str)) : '';
    };
    const evnetName = toHandlerKey(event);
    // 获取到 props 
    const eventFn = props[evnetName];
    if (eventFn) {
        eventFn.apply(instance.proxy, payload);
    }
}

// 初始化 props 
function initProps(instance, props) {
    // 如果 instance.vnode.props 存在
    if (instance.vnode.props) {
        instance.props = shallowReadOnly(props || {});
    }
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props
};
const PublicInstanceProxyHandler = {
    get({ instance }, key, receiver) {
        const { setupState, props, el } = instance;
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
    set(target, key, newValue, receiver) {
        return true;
    }
};

const initSlots = (instance, children) => {
    // 判断到底有没有 slots ，有 children 且 children 为 object
    if (instance.vnode.children && typeof instance.vnode.children === 'object') {
        if (instance && children) {
            const slots = {};
            for (const key in children) {
                // slot
                const value = children[key];
                slots[key] = (props) => normolizeSlotValue(value(props));
            }
            instance.slots = slots;
        }
    }
};
function normolizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

// 当前全局变量
let currentInstance = null;
// 创建组件实例 
function createComponentInstance(vnode, parent) {
    // console.log("parent",parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        next: null,
        slots: {},
        // 为什么这里指向的是 parent.provides ？ 去参考 provide 的代码就知道了，用于判断是否是第一次加载
        provides: parent ? parent.provides : {},
        parent,
        // 是否已经被挂载
        isMounted: false,
        subTree: {},
        component: null,
        update: () => { }
    };
    return component;
}
function setupComponent(instance) {
    // TODO 
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
// 初始化一个有状态的 component
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 这里需要做很多数据的代理 所以做了抽离 比如 $el $data $props
    instance.proxy = new Proxy({ instance }, PublicInstanceProxyHandler);
    const { setup } = Component;
    const { props } = instance;
    if (setup) {
        setCurrentInstance(instance);
        // 传递 props 
        const setupResult = setup(props, { emit: emit.bind(null, instance) }); // 开发小技巧，柯里化
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // if(Component.render){
    instance.render = Component.render;
    // }
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(value) {
    currentInstance = value;
}

// 只有在 setup 作用域下才有用
function provide(key, value) {
    // 存
    // 获取当前对象
    const instance = getCurrentInstance();
    if (instance) {
        let { provides } = instance;
        // 获取父级的 provides ，用于判断
        let parentProvides = instance.parent.provides;
        // 只能初始化一次 
        if (provides === parentProvides) {
            // 精髓所在， Object.create(parentProvides) 
            provides = instance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    // 获取当前对象
    const instance = getCurrentInstance();
    if (instance) {
        let { parent } = instance;
        let parentProvides = parent.provides;
        // while(parent){
        //     if(parentProvides[key]){
        //         return parentProvides[key]
        //     }
        //     parentProvides = parent.provides
        //     parent = parent.parent
        // }
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

// import { render } from "./renderer"
// 通过入参传入 render 
function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先转 vnode
                // component => vnode
                // 所有逻辑都是基于虚拟节点的
                const vnode = createVnode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
}

const queue = [];
let isFlush = false;
const p = Promise.resolve();
// nextTick的实现
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(fn) {
    if (!queue.includes(fn)) {
        queue.push(fn);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlush)
        return;
    isFlush = true;
    nextTick(flushJobs).finally(() => {
        isFlush = false;
    });
}
function flushJobs() {
    let job;
    while (job = queue.shift()) {
        job && job();
    }
}

function createRender(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // console.log('vnode1',vnode);
        // patch
        patch(null, vnode, container, null);
    }
    // 补丁
    // n1 -> 旧的 虚拟节点
    // n2 -> 新的 虚拟节点
    function patch(n1, n2, container, parentComponent, anchor = null) {
        // 去处理组件
        // 判断是 element 还是 componnet 类型
        const { type } = n2;
        switch (type) {
            case Fragment: {
                processFragment(n1, n2, container, parentComponent);
                break;
            }
            case Text: {
                processText(n1, n2, container, anchor);
                break;
            }
            default: {
                // const { shapFlag } = n2
                if (typeof type === 'object') {
                    // if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent);
                }
                else if (typeof type === 'string') {
                    // else if (shapFlag & ShapFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                break;
            }
        }
    }
    // 处理组件
    function processComponent(n1, n2, container, parentComponent) {
        if (!n1) {
            // 挂载组件
            mountComponent(n2, container, parentComponent);
        }
        else {
            // 更新组件
            patachComponent(n1, n2);
        }
    }
    // 处理 element 
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 初始化
        if (!n1) {
            // 挂载 element
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            // 更新
            patchElement(n1, n2, container, parentComponent);
        }
    }
    // 处理 fragment，只需要渲染子节点即可
    function processFragment(n1, n2, container, parentComponent) {
        // 挂载 fragment
        mountFragment(n2, container, parentComponent);
    }
    // 处理 Text 文本节点
    function processText(n1, n2, container, anchor) {
        const el = n2.el = document.createTextNode(n2.children);
        hostInsert(el, container, anchor);
    }
    // 挂载 element 
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        // 获取 children 
        const { children, props } = vnode;
        // const { shapFlag } = vnode
        // 判断是 string 还是 Array
        if (Array.isArray(children)) {
            // if (shapFlag & ShapFlags.ARRAY_CHILDREN) {
            mountChildren(vnode, el, parentComponent);
        }
        else if (typeof children === 'string') {
            // else if(shapFlag & ShapFlags.TEXT_CHILDREN){
            el.textContent = vnode.children;
        }
        // 属性更新到节点上 
        for (const key in props) {
            // 判断是否是 on 开头
            // 获取 val 
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // 添加元素
        hostInsert(el, container, anchor);
    }
    // element 打补丁
    function patchElement(n1, n2, container, parentComponent) {
        // console.log("n1", n1);
        // console.log("n2", n2);
        // 
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        // 由于之前的旧节点已经有了 el 了，但是新节点还没有 el 
        const el = (n2.el = n1.el);
        // 重新渲染属性
        patchProps(el, oldProps, newProps);
        // 孩子节点打补丁
        patchChildren(n1, n2, el, parentComponent);
    }
    // 
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 遍历新节点 看是否需要新增、删除、修改
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    // 修改属性
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (Object.keys(oldProps).length !== 0) {
                // 遍历旧节点 在新节点中不存在的属性就删除
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    // n1 -> old , n2 -> new
    function patchChildren(n1, n2, container, parentComponent) {
        const c1 = n1.children;
        const c2 = n2.children;
        // 新节点是文本
        if (typeof n2.children === 'string') {
            // 旧节点是数组
            if (n1.children instanceof Array) {
                // 把老的 Children 清空
                unmountChildren(n1.children);
                // 设置新的 children
                hostSetElementText(container, c2);
            }
            // 旧节点是文本
            else if (typeof n1.children === 'string') {
                if (n1.children !== n2.children) {
                    // 设置新的 children
                    hostSetElementText(container, c2);
                }
            }
        }
        // 新节点是数组
        else {
            // 旧节点是文本
            if (typeof n1.children === 'string') {
                // 清空数据
                hostSetElementText(container, "");
                // 挂载 子节点数据
                mountChildren(n2, container, parentComponent);
            }
            // 旧节点是数组
            else {
                patchKeyedChildren(c1, c2, container, parentComponent);
            }
        }
    }
    // 子节点打补丁
    function patchKeyedChildren(oldChildren, newChildren, container, parentComponent) {
        let newStartIndex = 0; // 新节点 开始索引
        let oldStartIndex = 0; // 旧节点 开始索引
        let newEndIndex = newChildren.length - 1; // 新节点 结束索引
        let oldEndIndex = oldChildren.length - 1; // 旧节点 结束索引
        let newStartElement = newChildren[newStartIndex];
        let oldStartElement = oldChildren[oldStartIndex];
        let newEndElement = newChildren[newEndIndex];
        let oldEndElement = oldChildren[oldEndIndex];
        // 
        while (newEndIndex >= newStartIndex && oldEndIndex >= oldStartIndex) {
            // 
            if (!oldStartElement) {
                oldStartElement = oldChildren[++oldStartIndex];
            }
            else if (!oldEndElement) {
                oldEndElement = oldChildren[--oldEndIndex];
            }
            else if (newStartElement.props.key === oldStartElement.props.key) {
                // 打补丁
                patch(oldStartElement, newStartElement, container, parentComponent);
                // 
                newStartElement = newChildren[++newStartIndex];
                oldStartElement = oldChildren[++oldStartIndex];
            }
            else if (newEndElement.props.key === oldEndElement.props.key) {
                // 打补丁
                patch(oldEndElement, newEndElement, container, parentComponent);
                // 
                newEndElement = newChildren[--newEndIndex];
                oldEndElement = oldChildren[--oldEndIndex];
            }
            else if (oldStartElement.props.key === newEndElement.props.key) {
                // 旧节点开始 和 新节点结束相同
                // 打补丁
                patch(oldStartElement, newEndElement, container, parentComponent);
                // 移动节点 旧的开始节点移动到 旧的结束节点的下一个兄弟节点之前即可
                hostInsert(oldStartElement.el, container, oldEndElement.el.nextSibling);
                oldStartElement = oldChildren[++oldStartIndex];
                newEndElement = newChildren[--newEndIndex];
            }
            else if (newStartElement.props.key === oldEndElement.props.key) {
                // 新节点开始 和 旧节点结束 相同
                // 打补丁
                patch(oldEndElement, newStartElement, container, parentComponent);
                // 移动节点 旧的结束节点移动到开头就行了
                hostInsert(oldStartElement.el, container, oldStartElement.el);
                newStartElement = newChildren[++newStartIndex];
                oldEndElement = oldChildren[--oldEndIndex];
            }
            else {
                // 如果都不满足条件 
                const nodeIndex = oldChildren.findIndex(m => m && m.props.key === newStartElement.props.key);
                // 如果找到了
                if (nodeIndex > -1) {
                    // 打补丁
                    patch(oldChildren[nodeIndex], newStartElement, container, parentComponent);
                    // 移动节点 
                    hostInsert(oldChildren[nodeIndex].el, container, oldStartElement.el);
                    // 置空
                    oldChildren[nodeIndex] = undefined;
                }
                // 如果都没找到 则表示新开始节点不存在 直接挂载即可
                else {
                    patch(null, newStartElement, container, parentComponent, oldStartElement.el);
                }
                newStartElement = newChildren[++newStartIndex];
            }
        }
        // 如果是 newEndIndex >= newStartIndex 证明还有新节点未挂载上
        // if(newEndIndex >= newStartIndex){
        while (newEndIndex >= newStartIndex) {
            // 打补丁
            patch(null, newEndElement, container, parentComponent, oldStartElement.el.nextSibling);
            newEndElement = newChildren[--newEndIndex];
        }
        // }
        // oldEndIndex >= oldStartIndex 还有旧节点未 卸载
        // if(oldEndIndex >= oldStartIndex){
        while (oldEndIndex >= oldStartIndex) {
            hostRemove(oldEndElement.el);
            oldEndElement = oldChildren[--oldEndIndex];
        }
        // }
    }
    // 卸载子节点
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            hostRemove(children[i].el);
        }
    }
    // 挂载子节点 
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach(vnode => {
            patch(null, vnode, container, parentComponent);
        });
    }
    // 挂载组件
    function mountComponent(initialvnode, container, parentComponent) {
        // 创建组件实例 
        const instance = (initialvnode.component = createComponentInstance(initialvnode, parentComponent));
        // console.log('instance', instance);
        // 这里面设置了响应式对象 + proxy + props 等重要数据
        setupComponent(instance);
        setupRenderEffect(instance, initialvnode, container);
    }
    // 更新组件
    function patachComponent(n1, n2) {
        const instance = n2.component = n1.component;
        if (shouldUpdateComponent(n1, n2)) {
            // 如果要在
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.next = n2;
        }
    }
    function setupRenderEffect(instance, initialvnode, container) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log("init");
                // 取到 proxy 对象
                const { proxy, props } = instance;
                const subTree = (instance.subtree = instance.render.call(proxy));
                // initialvnode -> path
                // initialvnode -> element -> mountElement
                patch(null, subTree, container, instance);
                // 以上代码执行完成之后 就代表所有节点都已经打补丁了， 
                // 此时 subTree 是根节点也就是 App.js render 返回节点生成的实例
                initialvnode.el = subTree.el;
                // 已经被挂载了
                instance.isMounted = true;
            }
            else {
                console.log("update");
                // 获取到最新的 props 
                // next 将要更新的 虚拟节点，vnode 旧的虚拟节点
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                // 取到 proxy 对象
                const { proxy, props } = instance;
                // 获取到新的 subtree
                const subTree = instance.render.call(proxy);
                // 旧的 subtree
                const preSubtree = instance.subtree;
                instance.subtree = subTree;
                patch(preSubtree, subTree, container, instance);
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            }
        });
    }
    // 更新前一个组件的数据
    function updateComponentPreRender(instance, nextVnode) {
        instance.vnode = nextVnode;
        instance.next = null;
        // 更新 props
        instance.props = nextVnode.props;
    }
    // 是否应当更新组件
    function shouldUpdateComponent(prevVNode, nextVNode) {
        const { props: prevProps } = prevVNode;
        const { props: nextProps } = nextVNode;
        for (const key in nextProps) {
            if (nextProps[key] !== prevProps[key]) {
                return true;
            }
        }
        return false;
    }
    // 挂载 fragment
    function mountFragment(vnode, container, parentComponent) {
        mountChildren(vnode, container, parentComponent);
    }
    return {
        createApp: createAppApi(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevProp, nextProp) {
    if (key.startsWith("on")) {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, nextProp);
    }
    else {
        if (nextProp === undefined || nextProp === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextProp);
        }
    }
}
// 添加元素
function insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
}
// 移除元素
function remove(el) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
// 设置文本
function setElementText(container, text) {
    container.textContent = text;
}
const renderer = createRender({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRender = createRender;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.renderer = renderer;
