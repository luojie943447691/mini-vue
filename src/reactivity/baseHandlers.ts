import { extend, isObject } from "../shared"
import { track, trigger } from "./effect"
import { reactive, ReactiveFlags, readOnly } from "./reactive"

const get = createGetter()
const set = createSetter()
const readOnlyGet = createGetter(true)
const shallowReadOnlyGet = createGetter(true,true)

// isReadOnly 只读 ，isShallow 深浅 true 表示浅
function createGetter(isReadOnly = false, isShallow = false) {
    return function get(target, key) {

        // 指定一个 key ，访问这个键的时候返回这个对象是否是 reactive 对象
        //     只要不是 isReadOnly 就是响应式对象
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadOnly
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadOnly
        }

        const res = Reflect.get(target, key)

        // 浅
        if (!isShallow) {
            // 看看 res 是否是 object ，是的话就变成 响应式对象/只读对象
            if (isObject(res)) {
                return isReadOnly ? readOnly(res) : reactive(res)
            }

            if (!isReadOnly) {
                // TODO 收集依赖
                track(target, key)
            }
        }


        return res
    }
}

function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value)
        // TODO 触发依赖
        trigger(target, key)
        return res
    }
}


// 处理 reactive 的
export const mutationHandlers = {
    // 比如 raw = {foo:1}
    // target 为 {foo:1}
    // key 为我们将要取的key 这里就以 foo 为例
    get,
    set
}

// 处理 readOnly 的
export const readOnlyHandler = {
    get: readOnlyGet,
    set(target, key, value) {
        console.warn(`${key.toString()}是只读属性，不能修改！`)
        return true;
    }
}

// 处理浅只读
// export const shallowReadOnlyHandler = extend({},readOnlyHandler,{get:shallowReadOnlyGet})
export const shallowReadOnlyHandler =  {
    get: shallowReadOnlyGet,
    set(target, key, value) {
        console.warn(`${key.toString()}是只读属性，不能修改！`)
        return true;
    }
}