import type { Editor } from '@tiptap/vue-3'
import { moveTableColumn, moveTableRow, selectedRect } from '@tiptap/pm/tables'

type Direction = -1 | 1

function currentRect(editor: Editor) {
  try {
    return selectedRect(editor.state)
  } catch {
    return null
  }
}

function targetIndex(editor: Editor, axis: 'row' | 'column', direction: Direction) {
  const rect = currentRect(editor)
  if (!rect) return null
  const size = axis === 'row' ? rect.map.height : rect.map.width
  const current = axis === 'row' ? rect.top : rect.left
  const target = current + direction
  return target >= 0 && target < size ? { current, target } : null
}

export function canMoveCurrentRow(editor: Editor, direction: Direction) {
  return targetIndex(editor, 'row', direction) !== null
}

export function canMoveCurrentColumn(editor: Editor, direction: Direction) {
  return targetIndex(editor, 'column', direction) !== null
}

export function moveCurrentRow(editor: Editor, direction: Direction) {
  const indexes = targetIndex(editor, 'row', direction)
  if (!indexes) return false
  return moveTableRow({ from: indexes.current, to: indexes.target })(
    editor.state,
    editor.view.dispatch
  )
}

export function moveCurrentColumn(editor: Editor, direction: Direction) {
  const indexes = targetIndex(editor, 'column', direction)
  if (!indexes) return false
  return moveTableColumn({ from: indexes.current, to: indexes.target })(
    editor.state,
    editor.view.dispatch
  )
}
