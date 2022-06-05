import { createRender } from '../../lib/guide-mini-vue.esm.js'

import {App} from './App.js'

//Create a Pixi Application
let app = new PIXI.Application({width: 350, height: 350});

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);


const renderer = createRender({
    createElement(type){
        if(type === "rect"){
            const rect = new PIXI.Graphics()
            rect.beginFill(0xff0000);
            rect.drawRect(0, 0, 100, 100);
            rect.endFill();
            return rect
        }
        
    },
    patchProp(el,key,val){
        el[key] = val;
    },
    insert(el,parent){
        parent.addChild(el)
    }
})


renderer.createApp(App).mount(app.stage)

// const rootContainer = document.querySelector("#app")

// createApp(App).mount(rootContainer)