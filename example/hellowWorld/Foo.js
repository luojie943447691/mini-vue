import { h, renderSlots,getCurrentInstance } from "../../lib/guide-mini-vue.esm.js";


export const Foo = {
    name:"Foo",
    setup(props, { emit }) {
        const instance = getCurrentInstance()
        console.log('Foo',instance);

        return {}
    },
    render() {
        const foo = h('p', {}, "foo")

        console.log(this.$slots)

        return h("div", {}, [renderSlots(this.$slots, "header", { age: 10 }), foo, renderSlots(this.$slots, "footer", { age: 20 })])
    }
}