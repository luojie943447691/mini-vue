import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";


export const Foo = {
    setup(props, { emit }) {

        return {}
    },
    render() {
        const foo = h('p', {}, "foo")

        console.log(this.$slots)

        return h("div", {}, [renderSlots(this.$slots, "header", { age: 10 }), foo, renderSlots(this.$slots, "footer", { age: 20 })])
    }
}