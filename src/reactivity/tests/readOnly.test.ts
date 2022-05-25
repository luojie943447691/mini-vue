import { isReadOnly, readOnly, isProxy } from "../reactive";

describe('readOnly',() =>{
    it('happy path',() =>{

        // 不可以被改写
        const original = {foo:1,bar:{baz:2}}
        const wrapped = readOnly(original);
        expect(wrapped).not.toBe(original)
        expect(isReadOnly(wrapped)).toBe(true)
        expect(isReadOnly(original)).not.toBe(true)
        expect(isReadOnly(wrapped.bar)).toBe(true)
        expect(wrapped.foo).toBe(1)

        // 
        expect(isProxy(wrapped)).toBe(true)
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
        const user = readOnly({
            age:12
        })
        user.age = 14
        expect(console.warn).toBeCalledTimes(1)
    })
})
