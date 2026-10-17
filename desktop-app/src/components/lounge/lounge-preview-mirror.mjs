// Motion-only mutations can be copied directly, without remeasuring the tree.
export function previewMotionOnly(before = '', after = '') {
  const layout = value => value.replace(/(?:^|;)\s*(?:transform|opacity)\s*:[^;]*/g, '').replace(/;\s*/g, ';').replace(/^;|;$/g, '').trim();
  return before !== after && layout(before) === layout(after);
}

const blocked = new Set(['IFRAME', 'OBJECT', 'EMBED', 'SCRIPT']);
const stripAttribute = name => /^(id|role|tabindex|autoplay|data-controller.*|data-testid|on.*|aria-.*)$/.test(name);

// Retain DOM identity and computed styles. Read the live tree first, then write
// the mirror, so mirror layout cannot repeatedly flush live layout mid-capture.
export function createPreviewMirror({ documentRef = document, readStyle = getComputedStyle } = {}) {
  const entries = new WeakMap();
  const dirty = new Set();
  let refreshAll = true;
  const invalidate = node => { if (node) dirty.add(node); else refreshAll = true; };
  const patchMotion = node => {
    const entry = entries.get(node);
    if (!entry || entry.kind !== 'element') return false;
    for (const property of ['transform', 'opacity']) {
      const value = node.style.getPropertyValue(property) || readStyle(node).getPropertyValue(property);
      if (entry.clone.style.getPropertyValue(property) !== value) entry.clone.style.setProperty(property, value);
    }
    return true;
  };
  const sync = (roots, origin, container) => {
    const jobs = [];
    const prepare = (node, inheritedDirty = false) => {
      let entry = entries.get(node);
      if (node.nodeType !== 1) {
        if (!entry) { entry = { clone: node.cloneNode(false) }; entries.set(node, entry); }
        jobs.push(() => { if (entry.clone.nodeValue !== node.nodeValue) entry.clone.nodeValue = node.nodeValue; });
        return entry.clone;
      }
      // Only cards/embedded content need individual geometry, not every label,
      // icon and decorative span. Root geometry is still read at real size.
      const rect = node.hasAttribute('data-lounge-game') || blocked.has(node.tagName) ? node.getBoundingClientRect() : null;
      const outside = node.hasAttribute('data-lounge-game') && (rect.right < origin.left || rect.left > origin.right || rect.bottom < origin.top || rect.top > origin.bottom);
      const kind = outside ? 'spacer' : blocked.has(node.tagName) ? 'blocked' : 'element';
      const fresh = !entry || entry.kind !== kind;
      if (fresh) {
        entry = { kind, clone: kind === 'element' ? node.cloneNode(false) : documentRef.createElement('span') };
        entries.set(node, entry);
      }
      const target = entry.clone;
      if (kind !== 'element') {
        const style = outside ? readStyle(node) : null;
        const margin = style?.margin || '0';
        const width = outside ? node.offsetWidth : rect.width;
        const height = outside ? node.offsetHeight : rect.height;
        jobs.push(() => {
          target.style.cssText = `display:block;flex:0 0 ${width}px;width:${width}px;height:${height}px;margin:${margin};overflow:hidden;`;
          target.textContent = node.tagName === 'IFRAME' ? 'Community widget' : '';
        });
        return target;
      }
      const styleDirty = fresh || refreshAll || inheritedDirty || dirty.has(node);
      let cssText;
      if (styleDirty) {
        const computed = readStyle(node);
        cssText = [...computed].map(property => `${property}:${computed.getPropertyValue(property)};`).join('');
      }
      // Capture attributes before writes too; never retain event/plugin runtime.
      const attributes = [...node.attributes].filter(attribute => attribute.name !== 'style' && !stripAttribute(attribute.name) && !(node.tagName === 'A' && attribute.name === 'href') && !(['VIDEO', 'AUDIO'].includes(node.tagName) && attribute.name === 'src'));
      const children = ['VIDEO', 'AUDIO'].includes(node.tagName) ? [] : [...node.childNodes].map(child => prepare(child, styleDirty));
      const scrollLeft = node.scrollLeft, scrollTop = node.scrollTop;
      jobs.push(() => {
        const names = new Set(attributes.map(attribute => attribute.name));
        for (const attribute of [...target.attributes]) if (attribute.name !== 'style' && !names.has(attribute.name)) target.removeAttribute(attribute.name);
        for (const attribute of attributes) if (target.getAttribute(attribute.name) !== attribute.value) target.setAttribute(attribute.name, attribute.value);
        if (cssText !== undefined && cssText !== entry.cssText) {
          target.style.cssText = cssText;
          target.style.setProperty('animation', 'none', 'important');
          target.style.setProperty('transition', 'none', 'important');
          entry.cssText = cssText;
        }
        target.tabIndex = -1;
        if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(node.tagName)) target.disabled = true;
        if (['VIDEO', 'AUDIO'].includes(node.tagName)) target.preload = 'none';
        if (target.childNodes.length !== children.length || children.some((child, index) => target.childNodes[index] !== child)) target.replaceChildren(...children);
        // Restore scrolling after the roots are attached, below.
      });
      jobs.push({ restore: () => {
        target.scrollLeft = scrollLeft; target.scrollTop = scrollTop;
        if (node.tagName === 'CANVAS' && styleDirty) { try { target.getContext('2d')?.drawImage(node, 0, 0); } catch { /* Unreadable canvas never blocks layout. */ } }
      } });
      return target;
    };
    const copies = roots.map(root => {
      const clone = prepare(root);
      const rect = root.getBoundingClientRect();
      jobs.push(() => Object.assign(clone.style, { position: 'absolute', left: `${rect.left - origin.left}px`, top: `${rect.top - origin.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, margin: '0', transform: 'none' }));
      return clone;
    });
    jobs.forEach(job => { if (typeof job === 'function') job(); });
    if (container.childNodes.length !== copies.length || copies.some((copy, index) => container.childNodes[index] !== copy)) container.replaceChildren(...copies);
    jobs.forEach(job => job.restore?.());
    dirty.clear(); refreshAll = false;
  };
  return { invalidate, patchMotion, sync };
}
