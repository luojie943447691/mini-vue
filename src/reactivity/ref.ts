import { hasChanged, isObject } from "../shared"
import { isTracking, track, trackEffect, triggerEffect } from "./effect"
import { reactive } from "./reactive"

// 如何监听单值 比如 1 "a" true 这样的数据发生变化呢？ 也就是 set get
// 针对对象我们可以用 Proxy，但是单值没有办法，所以就使用了 Ref 
// 将单值转换成对象的形式 也就是 RefImpl 实例对象，当我们 get value 的时候追踪依赖，set value 的时候触发依赖 

class RefImpl {
    private _value
    private _rawValue
    public deps
    public __v_isRef = true
    constructor(value) {
        // 没有被修饰过的数据
        this._rawValue = value
        // 看看 value 是否是对象 
        this._value = convert(value)
        this.deps = new Set()
    }
    get value() {
        trackRefValue(this)
        return this._value
    }
    set value(newValue) {
        // 如果相等 ，并且对比的时候需要两个普通的对象对比
        if(!hasChanged(this._rawValue,newValue))return;
        this._rawValue = newValue
        this._value = convert(newValue)
        // 先修改值 再通知
        triggerEffect(this.deps)
    }
}

function convert (value){
    return isObject(value) ? reactive(value) : value
}

function trackRefValue(ref){
    if (isTracking()) {
        // 收集依赖 
        trackEffect(ref.deps)
    }
}

export const ref = (value) => {
    return new RefImpl(value)
}

// isRef 是否是 ref 类型
export const isRef =(ref) =>{
    return !!ref.__v_isRef
}


export const unRef =(ref) =>{
    // 看看是不是 ref 对象，是的话就返回值
    // return isRef(ref) ? ref._rawValue : ref // 这里错的离谱 啊啊啊 
    return isRef(ref) ? ref.value : ref
}

export const proxyRefs = (objectWithRef) =>{
    return new Proxy(objectWithRef,{
        get(target,key){
            // 判断数据是否是 ref 
            return unRef(Reflect.get(target,key))
        },
        set(target,key,value,receiver){
            // const oldValue = Reflect.get(target,key,receiver)
            // if(unRef(oldValue) === unRef(newValue))return true;
            // const shouldValue = isRef(oldValue) && !isRef(newValue)? ref(newValue) :newValue
            // return Reflect.set(target,key, shouldValue,receiver)
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
              } else {
                return Reflect.set(target, key, value);
              }
        }
    })
}