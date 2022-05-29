import { h,createTextVNode,getCurrentInstance } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
    name:"App",
    render() {
        const app = h("div",{},"App")
        const foo = h(Foo,{},{
            header: ({age}) => [h("p",{},"123 " + age),createTextVNode("你好呀")],
            footer: ({age}) => h("p",{},"456 " + age)
        })
        // const foo = h(Foo,{},h("p",{},"123"))
        return h('div',{},[app,foo]) 
    },
    setup() {

        const instance = getCurrentInstance()
        console.log('App',instance);

        return {
            msg: "mini-vue"
        }
    }
}