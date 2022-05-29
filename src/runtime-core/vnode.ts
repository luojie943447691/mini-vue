import { ShapFlags } from "../shared/shapFlags"


export const Fragment = Symbol("Fragment")
export const Text = Symbol("Text")

export function createVnode(type,props?,children?){

    const vnode = {
        type,
        props,
        children,
        // shapFlag:getShapFlag(type),
        el:null
    }
    // children
    // if(typeof children === 'string'){
    //     vnode.shapFlag |= ShapFlags.TEXT_CHILDREN
    // }else if(Array.isArray(children)){
    //     vnode.shapFlag |= ShapFlags.ARRAY_CHILDREN
    // }

    return vnode
}

// 获取节点类型
// export function getShapFlag (type){
//     return typeof type === 'string' ? ShapFlags.ELEMENT: ShapFlags.STATEFUL_COMPONENT
// }

export function createTextVNode(text){
    return createVnode(Text,{},text)
}