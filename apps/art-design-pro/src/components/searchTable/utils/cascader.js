/**
 * 级联选择器点击 label 选中
 * @param {Object} node - 节点对象
 * @param {Object} data - 节点数据
 * @param {Object} props - cascader 的 props 配置
 * @param {Function} onSelect - 选中回调，参数为选中的值
 * @param {Function} onClose - 关闭面板回调（叶子节点才触发）
 */
export function handleCascaderClick( node, data, props, onSelect, onClose ) {
    // 没有开启 checkStrictly 则不处理，走默认行为
    if ( !props?.checkStrictly ) return
    const emitPath = props?.emitPath !== undefined ? props.emitPath : true
    const value = emitPath ? node.path : node.value

    onSelect && onSelect(value)

    if ( !data.children || data.children.length === 0 ) {
        onClose && onClose()
    }
}

/**
 * 关闭级联面板
 * @param {Object|Array} ref - cascader 的 ref
 */
export function closeCascaderPanel( ref ) {
    const cascaderRef = Array.isArray(ref) ? ref[ 0 ] : ref
    if ( cascaderRef ) {
        cascaderRef.dropDownVisible = false
    }
}
