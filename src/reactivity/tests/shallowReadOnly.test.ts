import { isReadOnly, readOnly, shallowReadOnly } from "../reactive";

describe('shallowReadOnly',() =>{
    it('shallowReadOnly call',() =>{

        // 不可以被改写
        const original = {foo:1,bar:{baz:2}}
        const wrapped = shallowReadOnly(original);
        
        expect(isReadOnly(wrapped)).toBe(true)
        expect(isReadOnly(wrapped.bar)).toBe(false)
        
    })

    it('warn then call set',() =>{
        // 方式一
        // const user = readOnly({
        //     age:12
        // })
        // user.age = 14
        // expect(user.age).toBe(14)

        // 方式二
        console.warn = jest.fn()
        const user = shallowReadOnly({
            age:12
        })
        user.age = 14
        expect(console.warn).toBeCalledTimes(1)
    })
})
