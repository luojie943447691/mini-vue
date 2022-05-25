import { extend } from "../shared";

// 当前活跃对象 
let activeEffect;
// 是否收集依赖 只需要收集一次就行
let shouldTrack = false;

class ReactiveEffect {
    public deps = []
    // 没有被清空 对应视频里面的 active 
    notClean = true
    // 
    onStop?:() =>void | undefined;
    constructor(private fn: Function, public schduler?) {
        this.fn = fn
        this.schduler = schduler
    }

    // 本质是在这里收集的依赖 
    run() {
        // activeEffect = this;
        // return this.fn()

        // 如果已经被清空过，则没有必要再次收集依赖
        if(!this.notClean){
            return this.fn()
        }

        // 
        shouldTrack = true;
        activeEffect = this
        const result = this.fn()
        shouldTrack = false
        return result
    }

    stop() {
        // 只要清空过一次 就不需要清空了
        if (this.notClean) {
            // 删除 effect 的函数
            cleanUpEffect(this)
            // 执行 onStop 方法
            if(this.onStop){
                this.onStop()
            }
            this.notClean = false
        }

    }
}

// 删除 effect 的函数
function cleanUpEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
    effect.deps.length = 0
}


// 用于收集依赖 收集的是什么依赖呢？
//     收集的是 当前 effect 传入的 fn 作为依赖，需要注意的是 fn 可能会传递多个相同的，所以我们要使用 weakMap或者Set
const targetMap = new WeakMap();
export function track(target: Record<any, any>, key: string | symbol) {
     if(!isTracking()) return;
    /* 对象如下
    {
        [target]:{
            [key]:[x,x,xx,x,x]
        }
    }
    */
    // target -> key -> dep
    let depsMap = targetMap.get(target)
    // 如果不存在
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap) // ** 为什么 ？？？？
    }

    let deps = depsMap.get(key)
    if (!deps) {
        // 第一次这是错误的  应该使用下面的方式
        // deps = []; // ** 这里为什么不用 [] 数组呢？ （当时的疑问已解决）
        // ** 为什么又不需要  set(target,depsMap) 了呢？ 等待后续解决  （确实第一次代码出错 也修正了）

        deps = new Set(); // 用 Set 是因为可以自动去重
        depsMap.set(key, deps)
    }

    trackEffect(deps)
}

export function isTracking(){
    // 如果我们的对象没有执行 effect 的话，是没有 activeEffect 的，所以得判断一下，如我们的 reactive.test.ts 
    return shouldTrack && activeEffect !== undefined
}

export function trackEffect(deps){
    if(deps.has(activeEffect)) return;
    deps.add(activeEffect)
    // 记录当前活跃对象的副作用函数数组
    activeEffect.deps.push(deps)
}

// 用于触发之前收集到的 fn 
export function trigger(target, key) {
    // 获取 target 对应的 weakMap 的值
    const targetMapValue = targetMap.get(target) // Set
    if(!targetMapValue) return;
    // 取出之前已经收集好的 key 对应的 Set 里面保存的 fn ，存的是一个数组
    const deps = targetMapValue.get(key)

    triggerEffect(deps)
}

// 触发函数
export function triggerEffect(deps){
    for (const fnObj of deps) {
        // 判断是否有 scheduler 
        if (fnObj.schduler) {
            fnObj.schduler()
        }
        else {
            fnObj.run()
        }

    }
} 

export function effect(fn: Function, options:any = {}) {
    // const schduler = options.scheduler;
    // const _effect = new ReactiveEffect(fn,schduler)
    const _effect = new ReactiveEffect(fn, options?.scheduler)

    // _effect.onStop = options.onStop;
    // 优化上边的代码 因为后续可能会有多个数据
    // Object.assign(_effect,options)
    extend(_effect,options)
    
    if(!options.lazy){
        _effect.run()
    }
    
    const runner: any = _effect.run.bind(_effect)
    // ** 注意这里 很厉害的写法
    runner.effect = _effect
    return runner// 处理this指向问题
    // fn()
}

// 停止监听某个对象
export function stop(runner) {
    runner.effect.stop()
}