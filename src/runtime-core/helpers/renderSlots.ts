import { createVnode } from "../vnode";


export function renderSlots(slots,name,props){
    const slot = slots[name]
    if(typeof slot === 'function'){
        return createVnode("div",{},slot(props))
    }
    if(slot) return createVnode("div",{},slot)
}