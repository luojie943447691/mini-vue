import { shallowReadOnly } from "../reactivity/reactive"


// 初始化 props 
export function initProps(instance,props){
    // 如果 instance.vnode.props 存在
    if(instance.vnode.props){
        instance.props = shallowReadOnly(props || {})
    }

}
