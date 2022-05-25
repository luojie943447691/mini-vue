import { effect } from '../effect'
import {isReactive, reactive,isProxy} from '../reactive'

describe('reactive',()=>{
    it('happy path',() =>{
        let value;
        const original = {foo:1}
        const observed = reactive(original) 
        // const runner = effect(() =>{
        //     value = observed.foo
        // })
        expect(observed).not.toBe(original)
        expect(observed.foo).toBe(1)
        // 判断是否是 reactive 类型
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(original)).toBe(false)

        // 
        expect(isProxy(observed)).toBe(true)
    })
})