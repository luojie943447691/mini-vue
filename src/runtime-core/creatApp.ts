// import { render } from "./renderer"
import { createVnode } from "./vnode"

// 通过入参传入 render 
export function createAppApi(render){
    return function createApp(rootComponent){
        return {
            mount(rootContainer){
                // 先转 vnode
                // component => vnode
                // 所有逻辑都是基于虚拟节点的
                const vnode = createVnode(rootComponent)
                
                render(vnode,rootContainer)
            }
        }
    }
}