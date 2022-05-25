import { ShapFlags } from "../shared/shapFlags"
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container: any) {
    // console.log('vnode1',vnode);
    // patch
    patch(vnode, container)
}


function patch(vnode, container: any) {
    // 去处理组件
    // 判断是 element 还是 componnet 类型
    // const { shapFlag } = vnode
    if (typeof vnode.type === 'object') {
        // if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
    }
    else if (typeof vnode.type === 'string') {
        // else if (shapFlag & ShapFlags.ELEMENT) {
        processElement(vnode, container)
    }
}

// 处理组件
function processComponent(vnode: any, container: any) {
    // 挂载组件
    mountComponent(vnode, container)
}

// 处理 element 
function processElement(vnode, container) {

    // 挂载 element
    mountElement(vnode, container)
}

// 挂载 element 
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type))

    // 获取 children 
    const { children, props } = vnode
    // const { shapFlag } = vnode

    // 判断是 string 还是 Array
    if (Array.isArray(children)) {
        // if (shapFlag & ShapFlags.ARRAY_CHILDREN) {
        mountChildren(vnode, el)
    }
    else if (typeof children === 'string') {
        // else if(shapFlag & ShapFlags.TEXT_CHILDREN){
        el.textContent = vnode.children
    }

    // 属性更新到节点上 
    for (const key in props) {
        // 判断是否是 on 开头
        if (key.startsWith("on")) {
            const eventName = key.slice(2).toLowerCase();

            el.addEventListener(eventName,props[key])
        }
        else {
            // 获取 val 
            const val = props[key]
            el.setAttribute(key, val)
        }

    }
    // 添加元素
    insert(el, container)
}

// 挂载子节点 
function mountChildren(vnode, container) {
    vnode.children.forEach(v => {
        patch(v, container)
    })
}

// 挂载组件
function mountComponent(initialvnode: any, container: any) {
    // 创建组件实例 
    const instance = createComponentInstance(initialvnode)

    // console.log('instance', instance);
    // 这里面设置了响应式对象 + proxy + props 等重要数据
    setupComponent(instance)

    setupRenderEffect(instance, initialvnode, container)
}


function setupRenderEffect(instance: any, initialvnode, container: any) {
    // 取到 proxy 对象
    const { proxy,props } = instance
    const subTree = instance.render.call(proxy)

    // initialvnode -> path
    // initialvnode -> element -> mountElement

    patch(subTree, container)
    // 以上代码执行完成之后 就代表所有节点都已经打补丁了， 
    // 此时 subTree 是根节点也就是 App.js render 返回节点生成的实例
    initialvnode.el = subTree.el
}

// 添加元素
function insert(el: HTMLElement, parent: HTMLElement, anchor = null) {
    parent.insertBefore(el, anchor)
}