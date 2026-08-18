import { Table, TableCell, TableHeader } from '@tiptap/extension-table'

const backgrounds = new Set(['neutral', 'red', 'amber', 'green', 'blue', 'purple'])
const alignments = new Set(['left', 'center', 'right'])

function cellAttributes() {
  return {
    background: {
      default: null,
      parseHTML: (element: HTMLElement) => {
        const value = element.getAttribute('data-background')
        return value && backgrounds.has(value) ? value : null
      },
      renderHTML: (attributes: Record<string, unknown>) =>
        attributes.background ? { 'data-background': attributes.background } : {}
    },
    align: {
      default: null,
      parseHTML: (element: HTMLElement) => {
        const value = element.getAttribute('data-align')
        return value && alignments.has(value) ? value : null
      },
      renderHTML: (attributes: Record<string, unknown>) =>
        attributes.align ? { 'data-align': attributes.align } : {}
    }
  }
}

export const BlogTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fit: {
        default: 'container',
        parseHTML: (element) => element.getAttribute('data-fit') || 'container',
        renderHTML: (attributes) => ({
          'data-blog-table': '1',
          'data-fit': attributes.fit === 'content' ? 'content' : 'container'
        })
      }
    }
  }
}).configure({
  resizable: true,
  renderWrapper: false,
  handleWidth: 5,
  cellMinWidth: 90,
  lastColumnResizable: true,
  allowTableNodeSelection: true
})

export const BlogTableCell = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellAttributes() }
  }
})

export const BlogTableHeader = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...cellAttributes() }
  }
})
