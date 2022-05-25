// 记录节点类型

export const enum ShapFlags {
    ELEMENT = 1, // 0001 表示 element 正常dom节点
    STATEFUL_COMPONENT = 1 << 1, // 0010 表示 component 组件
    TEXT_CHILDREN = 1 << 2, // 0100 文本节点
    ARRAY_CHILDREN = 1 << 3, // 1000  数组节点
}


