import { getCurrentInstance } from "./component";

// 只有在 setup 作用域下才有用
export function provide(key, value) {
    // 存
    // 获取当前对象
    const instance: any = getCurrentInstance()
    if (instance) {
        let { provides } = instance

        // 获取父级的 provides ，用于判断
        let parentProvides = instance.parent.provides

        // 只能初始化一次 
        if(provides === parentProvides){
            // 精髓所在， Object.create(parentProvides) 
            provides = instance.provides = Object.create(parentProvides)
        }

        provides[key] = value
    }
}


export function inject(key,defaultValue) {
    // 取
    // 获取当前对象
    const instance: any = getCurrentInstance()
    if (instance) {
        let { parent } = instance
        let parentProvides = parent.provides
        // while(parent){
        //     if(parentProvides[key]){
        //         return parentProvides[key]
        //     }
        //     parentProvides = parent.provides
        //     parent = parent.parent
        // }
        if(key in parentProvides){
            return parentProvides[key];
        }
        else if(defaultValue){
            if(typeof defaultValue === 'function'){
                return defaultValue()
            }
            return defaultValue
        }
    }
}