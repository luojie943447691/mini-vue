import { h, provide, inject } from "../../lib/guide-mini-vue.esm.js"

const Consumer = {
    name: "Consumer",
    setup() {
        const foo = inject("foo")
        const bar = inject("bar")
        const baz = inject("baz",() => "baz")
        return {
            foo, bar,baz
        }
    },
    render() {
        return h("div", {}, `Consumer - ${this.foo} - ${this.bar} - ${this.baz}`)
    }
}

const Provider = {
    name: "Provider",
    setup() {
        provide("foo", "fooVal")
        provide("bar", "barVal")
    },
    render() {
        return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)])
    }
}

const ProviderTwo = {
    name: "ProviderTwo",
    setup() {

        provide('foo',"fooTwo")
        const foo = inject("foo")
        return {
            foo
        }
    },
    render() {
        return h("div", {}, [h("p", {}, `ProviderTwo ${this.foo}`), h(Consumer)])
    }
}

export default {
    name: "App",
    setup() {

    },
    render() {
        return h("div", {}, [h("p", {}, "apiInject"), h(Provider)])
    }
}
