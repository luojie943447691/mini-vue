import { mutationHandlers, readOnlyHandler,shallowReadOnlyHandler } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReative',
    IS_READONLY = '__v_isReadOnly'
}

export function reactive(raw: Record<any, any>) {
    // 注意  在es5中 不支持 Proxy，所以需要我们去配置 tsconfig 的 lib 
    return createActiveObject(raw,mutationHandlers)
}

// 深只读方法
export function readOnly(raw) {
    return createActiveObject(raw,readOnlyHandler)
}

// 浅只读方法
export function shallowReadOnly(raw) {
    return createActiveObject(raw,shallowReadOnlyHandler)
}

// 是否是 reactive 对象
export function isReactive(value){
    return !!value[ReactiveFlags.IS_REACTIVE]
}

// 是否是只读对象
export function isReadOnly(value){
    return !!value[ReactiveFlags.IS_READONLY]
}

// 是否是 Proxy
export function isProxy(value){
    return isReactive(value) || isReadOnly(value)
}


function createActiveObject(raw,baseHandlers){
    return new Proxy(raw, baseHandlers)
}