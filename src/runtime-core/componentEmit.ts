import { capitalize, kebabToHump } from "../shared/index"


// 实现 emit 
export function emit(instance, event, ...payload) {

    const { props } = instance

    
    // 烤串转驼峰
    // var kebabToHump = (str:string) =>{
    //     // exec 必须要全局 不然要死循环
    //     const reg = /(?<=-)\w/g
    //     let temp;
    //     // 
    //     while(temp = reg.exec(str)){
    //         str = str.slice(0,temp.index-1) + temp[0].toUpperCase() + str.slice(temp.index + 1)
    //     }
    //     return  str
    // }

    
    // 组装 name 
    const toHandlerKey = (str:string) =>{
        return str ? 'on' + capitalize(kebabToHump(str)) : ''
    }

    const evnetName = toHandlerKey(event)
    // 获取到 props 
    const eventFn = props[evnetName]
    if (eventFn) {
        eventFn.apply(instance.proxy, payload)
    }
}