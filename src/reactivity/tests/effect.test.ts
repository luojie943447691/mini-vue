import { isReactive, reactive } from '../reactive'
import { effect, stop } from '../effect'

describe('effect', () => {
    // it('happy path',() =>{
    //     const user = reactive({
    //         age:10
    //     })
    //     let nextAge;

    //     // 通过 effect 收集依赖
    //     effect(() =>{
    //         nextAge = user.age + 2
    //         console.log(nextAge);
    //     })

    //     expect(nextAge).toBe(12)

    //     // update 
    //     user.age++
    //     expect(nextAge).toBe(13)

    // })

    // it('should return runner when call effect', () => {
    //     // 1. effect(fn) -> 返回一个 function (runner) -> 并且 runner 会去执行 fn 函数 -> return
    //     let dummy;
    //     let run: any;
    //     const scheduler = jest.fn(() => {
    //         run = runner
    //     })
    //     const obj = reactive({ foo: 1 })
    //     const runner = effect(
    //         () => {
    //             dummy = obj.foo
    //         },
    //         { scheduler }
    //     )

    //     expect(scheduler).not.toHaveBeenCalled()
    //     expect(dummy).toBe(1)
    //     obj.foo++;
    //     expect(scheduler).toHaveBeenCalledTimes(1);
    //     expect(dummy).toBe(1)
    //     run();
    //     expect(dummy).toBe(2);
    // })

    // it("stop", () => {
    //     let dummy;
    //     let obj = reactive({prop:1})
    //     const runner = effect(() => {
    //         dummy = obj.prop
    //     })
    //     obj.prop = 2
    //     expect(dummy).toBe(2)
    //     stop(runner)
    //     // obj.prop = 4
    //     obj.prop++
    //     expect(dummy).toBe(2)
    //     runner()
    //     expect(dummy).toBe(3)
    //     obj.prop = 5
    //     runner()
    //     expect(dummy).toBe(5)
    // })

    // it("onStop", () => {
    //     let dummy;
    //     let obj = reactive({ prop: 1 })
    //     const onStop = jest.fn()
    //     const runner = effect(
    //         () => {
    //             dummy = obj.prop
    //         },
    //         {onStop}
    //     )
    //     stop(runner)
    //     expect(onStop).toBeCalledTimes(1)
    // })


    // 深响应式对象
    it('deep',() =>{
        let data = {
            foo:{
                bar:1
            },
            arr:[{a:1}]
        }
        let obj = reactive(data)
        expect(isReactive(obj.foo)).toBe(true)
        expect(isReactive(obj.arr[0])).toBe(true)
    })
})