import { effect } from "./effect";

class ComputedRefIpl {
    private _getter: any
    // 存储上一次的值
    private _oldValue;
    // 是否被污染（是否被调用过） 言外之意就是如果这个标识为 true 就执行函数获取数据，否则就返回 oldValue
    private _dirty: boolean = true
    constructor(getter) {
        this._getter = getter
    }

    get value() {
        const _this = this
        // 由于 _getter 不能出现访问一次就执行一次的情况，所以需要 lazy，
        //     又可以通过 scheduler 对其他变量的控制从而达到 执行 _getter 的目的
        const runner = effect(this._getter, {
            lazy: true,
            scheduler() {
                if (!_this._dirty) {
                    _this._dirty = true
                }
            }
        })

        if (this._dirty) {
            this._oldValue = runner()
            this._dirty = false
        }

        return this._oldValue
    }
}

export function computed(getter) {
    // // 存储上一次的值
    // let oldValue;
    // // 是否被污染 言外之意就是如果这个标识为true就执行函数获取数据，否则就返回 oldValue
    // let dirty = true
    // // 要去实现 effect 
    // const runner = effect(getter, {
    //     lazy: true,
    //     scheduler() {
    //         dirty = true
    //     }
    // })
    // const obj = {
    //     get value() {
    //         if (dirty) {
    //             dirty = false;
    //             return oldValue = runner()
    //         }
    //         return oldValue
    //     }
    // }
    // return obj
    return new ComputedRefIpl(getter)
}

