import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

window.self = null
export const App = {
    render() {
        window.self = this
        // console.log(this.$el);
        return h(
            "div",
            {
                id: 'root',
                class: ['red', 'hard'],
                onClick() {
                    console.log('click啦');
                },
            },
            // "hi," + this.msg
            // "hi mini-vue"
            [
                h('p', { class: 'red' }, 'hi1'),
                h(Foo, { 
                    onAdd(a,b){
                        console.log(a,b);
                        console.log("onAdd");
                    },
                    // emit 使用 add-foo-bar 调用
                    onAddFooBar(){
                        console.log("onAddFooBar");
                    }
                 }),
            ]
        )
    },
    setup() {
        return {
            msg: "mini-vue"
        }
    }
}