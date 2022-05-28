

export const initSlots = (instance, children) => {

    // 判断到底有没有 slots ，有 children 且 children 为 object
    if (instance.vnode.children && typeof instance.vnode.children === 'object') {
        if (instance && children) {
            const slots = {}
            for (const key in children) {
                // slot
                const value = children[key]
                slots[key] = (props) => normolizeSlotValue(value(props))
            }

            instance.slots = slots
        }
    }
}

function normolizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}