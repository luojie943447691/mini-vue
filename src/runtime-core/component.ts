import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandler } from "./componentPublicInstance"


// 创建组件实例 
export function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},

    }
    return component
}


export function setupComponent(instance) {
    // TODO 
    initProps(instance, instance.vnode.props)
    //  initSlots()

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
        // 传递 props 
        const setupResult = setup(props, { emit:emit.bind(null, instance) }) // 开发小技巧，柯里化

        handleSetupResult(instance, setupResult)
    }

}



function handleSetupResult(instance, setupResult: any) {
    // function Object

    // TODO function


    if (typeof setupResult === 'object') {
        instance.setupState = setupResult
    }

    finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
    const Component = instance.type
    // if(Component.render){
    instance.render = Component.render
    // }
}

