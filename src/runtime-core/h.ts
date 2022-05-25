import { createVnode } from "./vnode";

export function h(type,props?,chidren?){
    return createVnode(type,props,chidren)
}