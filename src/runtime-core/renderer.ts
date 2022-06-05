import { effect } from "../reactivity/effect"
import { ShapFlags } from "../shared/shapFlags"
import { createComponentInstance, setupComponent } from "./component"
import { createAppApi } from "./creatApp"
import { queueJobs } from "./scheduler"
import { Fragment, Text } from "./vnode"

export function createRender(options) {

    const {
        createElement: hostCreateElement,
        patchProp: hostPatchProp,
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText,
    } = options

    function render(vnode, container: any) {
        // console.log('vnode1',vnode);
        // patch
        patch(null, vnode, container, null)
    }

    // 补丁
    // n1 -> 旧的 虚拟节点
    // n2 -> 新的 虚拟节点
    function patch(n1, n2, container: any, parentComponent, anchor = null) {
        // 去处理组件
        // 判断是 element 还是 componnet 类型
        const { type } = n2

        switch (type) {
            case Fragment: {
                processFragment(n1, n2, container, parentComponent)
                break;
            }
            case Text: {
                processText(n1, n2, container, anchor)
                break;
            }
            default: {
                // const { shapFlag } = n2
                if (typeof type === 'object') {
                    // if (shapFlag & ShapFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent)
                }
                else if (typeof type === 'string') {
                    // else if (shapFlag & ShapFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent, anchor)
                }
                break;
            }
        }

    }

    // 处理组件
    function processComponent(n1, n2, container: any, parentComponent) {
        if (!n1) {
            // 挂载组件
            mountComponent(n2, container, parentComponent)
        }
        else {
            // 更新组件
            patachComponent(n1, n2)
        }
    }

    // 处理 element 
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 初始化
        if (!n1) {
            // 挂载 element
            mountElement(n2, container, parentComponent, anchor)
        }
        else {
            // 更新
            patchElement(n1, n2, container, parentComponent)
        }
    }

    // 处理 fragment，只需要渲染子节点即可
    function processFragment(n1, n2, container, parentComponent) {
        // 挂载 fragment
        mountFragment(n2, container, parentComponent)
    }

    // 处理 Text 文本节点
    function processText(n1, n2, container, anchor) {
        const el = n2.el = document.createTextNode(n2.children)
        hostInsert(el, container, anchor)
    }

    // 挂载 element 
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type))

        // 获取 children 
        const { children, props } = vnode
        // const { shapFlag } = vnode

        // 判断是 string 还是 Array
        if (Array.isArray(children)) {
            // if (shapFlag & ShapFlags.ARRAY_CHILDREN) {
            mountChildren(vnode, el, parentComponent)
        }
        else if (typeof children === 'string') {
            // else if(shapFlag & ShapFlags.TEXT_CHILDREN){
            el.textContent = vnode.children
        }

        // 属性更新到节点上 
        for (const key in props) {
            // 判断是否是 on 开头
            // 获取 val 
            const val = props[key]

            hostPatchProp(el, key, null, val)
        }
        // 添加元素
        hostInsert(el, container, anchor)
    }

    // element 打补丁
    function patchElement(n1, n2, container, parentComponent) {
        // console.log("n1", n1);
        // console.log("n2", n2);

        // 
        const oldProps = n1.props || {}
        const newProps = n2.props || {}
        // 由于之前的旧节点已经有了 el 了，但是新节点还没有 el 
        const el = (n2.el = n1.el)
        // 重新渲染属性
        patchProps(el, oldProps, newProps)
        // 孩子节点打补丁
        patchChildren(n1, n2, el, parentComponent)
    }

    // 
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 遍历新节点 看是否需要新增、删除、修改
            for (const key in newProps) {
                const prevProp = oldProps[key]
                const nextProp = newProps[key]

                if (prevProp !== nextProp) {
                    // 修改属性
                    hostPatchProp(el, key, prevProp, nextProp)
                }
            }
            if (Object.keys(oldProps).length !== 0) {
                // 遍历旧节点 在新节点中不存在的属性就删除
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null)
                    }
                }
            }
        }
    }

    // n1 -> old , n2 -> new
    function patchChildren(n1, n2, container, parentComponent) {
        const c1 = n1.children
        const c2 = n2.children
        // 新节点是文本
        if (typeof n2.children === 'string') {
            // 旧节点是数组
            if (n1.children instanceof Array) {

                // 把老的 Children 清空
                unmountChildren(n1.children)
                // 设置新的 children
                hostSetElementText(container, c2)
            }
            // 旧节点是文本
            else if (typeof n1.children === 'string') {
                if (n1.children !== n2.children) {
                    // 设置新的 children
                    hostSetElementText(container, c2)
                }
            }
        }
        // 新节点是数组
        else {
            // 旧节点是文本
            if (typeof n1.children === 'string') {
                // 清空数据
                hostSetElementText(container, "")
                // 挂载 子节点数据
                mountChildren(n2, container, parentComponent)
            }
            // 旧节点是数组
            else {
                patchKeyedChildren(c1, c2, container, parentComponent)
            }
        }
    }

    // 子节点打补丁
    function patchKeyedChildren(oldChildren, newChildren, container, parentComponent) {
        let newStartIndex = 0;// 新节点 开始索引
        let oldStartIndex = 0;// 旧节点 开始索引
        let newEndIndex = newChildren.length - 1;// 新节点 结束索引
        let oldEndIndex = oldChildren.length - 1;// 旧节点 结束索引

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
                patch(oldStartElement, newStartElement, container, parentComponent)
                // 
                newStartElement = newChildren[++newStartIndex];
                oldStartElement = oldChildren[++oldStartIndex];
            }
            else if (newEndElement.props.key === oldEndElement.props.key) {
                // 打补丁
                patch(oldEndElement, newEndElement, container, parentComponent)
                // 
                newEndElement = newChildren[--newEndIndex];
                oldEndElement = oldChildren[--oldEndIndex];
            }
            else if (oldStartElement.props.key === newEndElement.props.key) {
                // 旧节点开始 和 新节点结束相同
                // 打补丁
                patch(oldStartElement, newEndElement, container, parentComponent)
                // 移动节点 旧的开始节点移动到 旧的结束节点的下一个兄弟节点之前即可
                hostInsert(oldStartElement.el, container, oldEndElement.el.nextSibling)

                oldStartElement = oldChildren[++oldStartIndex];
                newEndElement = newChildren[--newEndIndex];
            }
            else if (newStartElement.props.key === oldEndElement.props.key) {
                // 新节点开始 和 旧节点结束 相同
                // 打补丁
                patch(oldEndElement, newStartElement, container, parentComponent)
                // 移动节点 旧的结束节点移动到开头就行了
                hostInsert(oldStartElement.el, container, oldStartElement.el)

                newStartElement = newChildren[++newStartIndex];
                oldEndElement = oldChildren[--oldEndIndex];
            }
            else {

                // 如果都不满足条件 
                const nodeIndex = oldChildren.findIndex(m => m && m.props.key === newStartElement.props.key)
                // 如果找到了
                if (nodeIndex > -1) {
                    // 打补丁
                    patch(oldChildren[nodeIndex], newStartElement, container, parentComponent)
                    // 移动节点 
                    hostInsert(oldChildren[nodeIndex].el, container, oldStartElement.el)
                    // 置空
                    oldChildren[nodeIndex] = undefined
                }
                // 如果都没找到 则表示新开始节点不存在 直接挂载即可
                else {
                    patch(null, newStartElement, container, parentComponent, oldStartElement.el)
                }
                newStartElement = newChildren[++newStartIndex]
            }
        }

        // 如果是 newEndIndex >= newStartIndex 证明还有新节点未挂载上
        // if(newEndIndex >= newStartIndex){
        while (newEndIndex >= newStartIndex) {
            // 打补丁
            patch(null, newEndElement, container, parentComponent, oldStartElement.el.nextSibling)
            newEndElement = newChildren[--newEndIndex]
        }
        // }
        // oldEndIndex >= oldStartIndex 还有旧节点未 卸载
        // if(oldEndIndex >= oldStartIndex){
        while (oldEndIndex >= oldStartIndex) {
            hostRemove(oldEndElement.el);
            oldEndElement = oldChildren[--oldEndIndex]
        }
        // }
    }

    // 卸载子节点
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            hostRemove(children[i].el)
        }
    }

    // 挂载子节点 
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach(vnode => {
            patch(null, vnode, container, parentComponent)
        })
    }

    // 挂载组件
    function mountComponent(initialvnode: any, container: any, parentComponent: any) {
        // 创建组件实例 
        const instance = (initialvnode.component = createComponentInstance(initialvnode, parentComponent))

        // console.log('instance', instance);
        // 这里面设置了响应式对象 + proxy + props 等重要数据
        setupComponent(instance)

        setupRenderEffect(instance, initialvnode, container)
    }

    // 更新组件
    function patachComponent(n1, n2) {
        const instance = n2.component = n1.component
        if (shouldUpdateComponent(n1, n2)) {
            // 如果要在
            instance.next = n2
            instance.update()
        }
        else {
            n2.el = n1.el
            instance.next = n2
        }
    }

    function setupRenderEffect(instance: any, initialvnode, container: any) {

        instance.update = effect(() => {

            if (!instance.isMounted) {
                console.log("init");
                // 取到 proxy 对象
                const { proxy, props } = instance
                const subTree = (instance.subtree = instance.render.call(proxy))
                // initialvnode -> path
                // initialvnode -> element -> mountElement

                patch(null, subTree, container, instance)
                // 以上代码执行完成之后 就代表所有节点都已经打补丁了， 
                // 此时 subTree 是根节点也就是 App.js render 返回节点生成的实例
                initialvnode.el = subTree.el

                // 已经被挂载了
                instance.isMounted = true
            }
            else {
                console.log("update");
                // 获取到最新的 props 
                // next 将要更新的 虚拟节点，vnode 旧的虚拟节点
                const { next, vnode } = instance
                if (next) {
                    next.el = vnode.el
                    updateComponentPreRender(instance, next)
                }

                // 取到 proxy 对象
                const { proxy, props } = instance
                // 获取到新的 subtree
                const subTree = instance.render.call(proxy)
                // 旧的 subtree
                const preSubtree = instance.subtree
                instance.subtree = subTree

                patch(preSubtree, subTree, container, instance)
            }
        },
        {
            scheduler(){
                queueJobs(instance.update)
            }
        }
        )

    }

    // 更新前一个组件的数据
    function updateComponentPreRender(instance, nextVnode) {
        instance.vnode = nextVnode
        instance.next = null

        // 更新 props
        instance.props = nextVnode.props
    }

    // 是否应当更新组件
    function shouldUpdateComponent(prevVNode, nextVNode) {
        const { props: prevProps } = prevVNode
        const { props: nextProps } = nextVNode
        for (const key in nextProps) {
            if (nextProps[key] !== prevProps[key]) {
                return true
            }
        }
        return false
    }

    // 挂载 fragment
    function mountFragment(vnode, container, parentComponent) {
        mountChildren(vnode, container, parentComponent)
    }

    return {
        createApp: createAppApi(render)
    }
}