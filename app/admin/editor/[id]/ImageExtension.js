'use client'
import Image from '@tiptap/extension-image'

/**
 * Custom Image extension that renders caption (title attr) and alt text below
 * each image in the editor, so they are visible at a glance without entering
 * an edit state. Uses a vanilla-DOM NodeView to avoid React NodeViewRenderer
 * overhead and to keep the existing hover-control event listeners working
 * (they detect `e.target.tagName === 'IMG'`, which still works here).
 *
 * The saved HTML output is still a plain <img> tag (via renderHTML) — the
 * figure/caption wrapper only exists in the editor view.
 */
export const ImageWithCaption = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      suggestionDescription: {
        default: null,
        parseHTML: element => element.getAttribute('data-suggestion-description'),
        renderHTML: attrs => attrs.suggestionDescription
          ? { 'data-suggestion-description': attrs.suggestionDescription }
          : {},
      },
    }
  },

  addNodeView() {
    return ({ node }) => {
      /* ── Outer wrapper ── */
      const dom = document.createElement('figure')
      dom.style.cssText = 'margin:14px 0;display:block;'

      /* ── The actual <img> ── */
      const img = document.createElement('img')
      img.setAttribute('src', node.attrs.src ?? '')
      img.style.cssText = 'max-width:100%;display:block;height:auto;border-radius:3px;'
      if (node.attrs.alt)   img.setAttribute('alt',   node.attrs.alt)
      if (node.attrs.title) img.setAttribute('title', node.attrs.title)
      dom.appendChild(img)

      /* ── Caption (title attr) ── */
      const caption = document.createElement('p')
      caption.style.cssText = [
        'margin:5px 0 0',
        'font-style:italic',
        'color:#a39c92',
        'font-size:13px',
        'line-height:1.4',
        'text-align:center',
        'font-family:"DM Sans",sans-serif',
        'pointer-events:none',
        'user-select:none',
      ].join(';')
      caption.textContent = node.attrs.title ?? ''
      caption.style.display = node.attrs.title ? 'block' : 'none'
      dom.appendChild(caption)

      /* ── Alt-text label ── */
      const altDisplay = document.createElement('p')
      altDisplay.style.cssText = [
        'margin:2px 0 0',
        'color:#7a7470',
        'font-size:11px',
        'line-height:1.3',
        'text-align:center',
        'font-family:"DM Sans",sans-serif',
        'pointer-events:none',
        'user-select:none',
      ].join(';')
      altDisplay.textContent = node.attrs.alt ? `Alt: ${node.attrs.alt}` : ''
      altDisplay.style.display = node.attrs.alt ? 'block' : 'none'
      dom.appendChild(altDisplay)

      return {
        dom,

        /* Called by TipTap when node attrs change (edit/move/etc.) */
        update(updatedNode) {
          if (updatedNode.type.name !== 'image') return false

          img.setAttribute('src', updatedNode.attrs.src ?? '')
          if (updatedNode.attrs.alt)   img.setAttribute('alt',   updatedNode.attrs.alt)
          else                         img.removeAttribute('alt')
          if (updatedNode.attrs.title) img.setAttribute('title', updatedNode.attrs.title)
          else                         img.removeAttribute('title')

          caption.textContent = updatedNode.attrs.title ?? ''
          caption.style.display = updatedNode.attrs.title ? 'block' : 'none'

          altDisplay.textContent = updatedNode.attrs.alt ? `Alt: ${updatedNode.attrs.alt}` : ''
          altDisplay.style.display = updatedNode.attrs.alt ? 'block' : 'none'

          return true
        },
      }
    }
  },
})
