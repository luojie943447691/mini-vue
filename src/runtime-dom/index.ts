import { createRender } from '../runtime-core'

function createElement(type) {
    return document.createElement(type)
}


function patchProp(el, key, prevProp,nextProp) {
    if (key.startsWith("on")) {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, nextProp)
    }
    else {
        if(nextProp === undefined || nextProp === null){
            el.removeAttribute(key)
        }
        else{
            el.setAttribute(key, nextProp)
        }
        
    }
}

// 添加元素
function insert(el: any, parent: HTMLElement, anchor = null) {
    parent.insertBefore(el, anchor)
}

// 移除元素
function remove(el){
    const parent = el.parentNode
    if(parent){
        parent.removeChild(el)
    }
}

// 设置文本
function setElementText(container,text){
    container.textContent = text
}


export const renderer:any = createRender({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
})

export function createApp(...args){
    return renderer.createApp(...args)
}

export * from '../runtime-core'