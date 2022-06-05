import { proxyRefs } from "../reactivity"
import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandler } from "./componentPublicInstance"
import { initSlots } from "./componentSlots"

// 当前全局变量
let currentInstance = null

// 创建组件实例 
export function createComponentInstance(vnode,parent) {
    // console.log("parent",parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        next:null,
        slots:{},
        // 为什么这里指向的是 parent.provides ？ 去参考 provide 的代码就知道了，用于判断是否是第一次加载
        provides: parent ? parent.provides : {}, 
        parent,
        // 是否已经被挂载
        isMounted:false,
        subTree:{},
        component:null,
        update:() => {}
    }
    return component
}


export function setupComponent(instance) {
    // TODO 
    initProps(instance, instance.vnode.props)
    initSlots(instance, instance.vnode.children)

    setupStatefulComponent(instance)
}



// 初始化一个有状态的 component
function setupStatefulComponent(instance: any) {
    const Component = instance.type

    // 这里需要做很多数据的代理 所以做了抽离 比如 $el $data $props
    instance.proxy = new Proxy({ instance }, PublicInstanceProxyHandler)

    const { setup } = Component;

    const { props } = instance

    if (setup) {
        setCurrentInstance(instance)
        // 传递 props 
        const setupResult = setup(props, { emit:emit.bind(null, instance) }) // 开发小技巧，柯里化
        setCurrentInstance(null)

        handleSetupResult(instance, setupResult)
    }

}



function handleSetupResult(instance, setupResult: any) {
    // function Object

    // TODO function


    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult)
    }

    finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
    const Component = instance.type
    // if(Component.render){
    instance.render = Component.render
    // }
}

export function getCurrentInstance(){
    return currentInstance
}

function setCurrentInstance(value){
    currentInstance = value
}
