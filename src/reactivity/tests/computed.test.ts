import { computed } from "../computed"
import { reactive } from "../reactive"


describe('computed',() =>{

    // it('happy path',() =>{

    //     const user = reactive({
    //         age:1
    //     })

    //     const age = computed(() =>{
    //         return user.age
    //     })

    //     expect(age.value).toBe(1)
    // })

    it('should be lazily',() =>{

        const value = reactive({
            foo:1
        })

        const getter = jest.fn(() =>{
            return value.foo
        })

        const age = computed(getter)

        expect(getter).not.toHaveBeenCalled()

        expect(age.value).toBe(1)
        expect(getter).toBeCalledTimes(1)

        expect(age.value).toBe(1)
        expect(getter).toBeCalledTimes(1)

        // lazy 
        value.foo = 2
        expect(age.value).toBe(2)
        expect(getter).toBeCalledTimes(2)

        expect(age.value).toBe(2)
        expect(getter).toBeCalledTimes(2)
    })
})