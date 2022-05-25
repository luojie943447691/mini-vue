import { hasOwn } from "../shared/index"

const publicPropertiesMap = {
    $el:(i) => i.vnode.el 
}

export const PublicInstanceProxyHandler = {
    get({instance }, key, receiver) {
        const { setupState,props, el } = instance
        // 如果访问的是 $el 、 $data 、 $props 等，则返回相应的数据
        if (hasOwn(publicPropertiesMap,key)) {
            return publicPropertiesMap[key](instance)
        }
        else if(hasOwn(props,key)){
            return Reflect.get(props, key)
        }

        else if (key in setupState) {
            return Reflect.get(setupState, key)
        }
    },
    set(target, key, newValue, receiver) {
        return true
    }
}
