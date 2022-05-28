import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
    render() {
        const app = h("div",{},"App")
        const foo = h(Foo,{},{
            header: ({age}) => h("p",{},"123 " + age),
            footer: ({age}) => h("p",{},"456 " + age)
        })
        // const foo = h(Foo,{},h("p",{},"123"))
        return h('div',{},[app,foo]) 
    },
    setup() {
        return {
            msg: "mini-vue"
        }
    }
}