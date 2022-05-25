export const extend = Object.assign;


export const isObject = (value:any):value is Object =>{
    return value !== null && typeof value === 'object'
}

export const hasChanged = (value,newValue) =>{
    return !Object.is(value,newValue)
}

export const hasOwn = (target,key) => {
    return Object.prototype.hasOwnProperty.call(target,key)
}


// 开头大写
export const capitalize = (str:string) => {
    return str[0].toUpperCase() + str.slice(1)
}

export const kebabToHump = (str:string) =>{
    return str.replace(/-(\w)/g,(_,s:string) =>{
        return s ? s.toUpperCase() : ""
    })
}
