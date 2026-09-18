import { VisualElement, ElementTag } from '../types/editor';

/**
 * Ensure all elements in the tree have standard arrays and objects
 */
export function normalizeProjectTree(element: VisualElement): VisualElement {
  if (!element) {
    return {
      id: `el-div-${Math.random().toString(36).substring(2, 7)}`,
      tag: 'div',
      name: 'Container',
      classes: '',
      styles: {},
      attributes: {},
      content: '',
      children: [],
      bindings: {},
    };
  }

  return {
    ...element,
    id: element.id || `el-${element.tag || 'div'}-${Math.random().toString(36).substring(2, 7)}`,
    tag: element.tag || 'div',
    name: element.name || `<${element.tag || 'div'}>`,
    classes: typeof element.classes === 'string' ? element.classes : '',
    styles: element.styles && typeof element.styles === 'object' ? element.styles : {},
    attributes: element.attributes && typeof element.attributes === 'object' ? element.attributes : {},
    content: typeof element.content === 'string' ? element.content : '',
    bindings: element.bindings && typeof element.bindings === 'object' ? element.bindings : {},
    children: Array.isArray(element.children)
      ? element.children.map(normalizeProjectTree)
      : [],
  };
}

export function findElementById(root: VisualElement, id: string): VisualElement | null {
  if (!root) return null;
  if (root.id === id) return root;
  if (root.children && Array.isArray(root.children)) {
    for (const child of root.children) {
      const found = findElementById(child, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParentInTree(root: VisualElement, childId: string): VisualElement | null {
  if (!root || !root.children || !Array.isArray(root.children)) return null;
  for (const child of root.children) {
    if (child.id === childId) return root;
    const deep = findParentInTree(child, childId);
    if (deep) return deep;
  }
  return null;
}

export function isDescendantOf(root: VisualElement, parentId: string, candidateChildId: string): boolean {
  if (parentId === candidateChildId) return true;
  const parent = findElementById(root, parentId);
  if (!parent) return false;
  return !!findElementById(parent, candidateChildId);
}

export function updateElementInTree(
  root: VisualElement,
  id: string,
  updater: (el: VisualElement) => VisualElement
): VisualElement {
  if (!root) return root;
  if (root.id === id) {
    return updater({ ...root });
  }

  return {
    ...root,
    children: (root.children || []).map((child) => updateElementInTree(child, id, updater)),
  };
}

export function removeElementFromTree(root: VisualElement, id: string): VisualElement {
  if (!root) return root;
  return {
    ...root,
    children: (root.children || [])
      .filter((child) => child.id !== id)
      .map((child) => removeElementFromTree(child, id)),
  };
}

export function addChildToElement(
  root: VisualElement,
  parentId: string,
  newChild: VisualElement
): VisualElement {
  if (!root) return root;
  if (root.id === parentId) {
    return {
      ...root,
      children: [...(root.children || []), newChild],
    };
  }

  return {
    ...root,
    children: (root.children || []).map((child) => addChildToElement(child, parentId, newChild)),
  };
}

export function insertElementAt(
  root: VisualElement,
  targetId: string,
  newElement: VisualElement,
  position: 'before' | 'after' | 'inside'
): VisualElement {
  if (!root) return root;

  if (root.id === targetId) {
    if (position === 'inside') {
      return {
        ...root,
        children: [...(root.children || []), newElement],
      };
    }
    // If attempting before/after on root element itself, place inside at start/end
    return {
      ...root,
      children:
        position === 'before'
          ? [newElement, ...(root.children || [])]
          : [...(root.children || []), newElement],
    };
  }

  const children = root.children || [];
  const targetIndex = children.findIndex((c) => c.id === targetId);

  if (targetIndex !== -1) {
    if (position === 'before') {
      const nextChildren = [...children];
      nextChildren.splice(targetIndex, 0, newElement);
      return { ...root, children: nextChildren };
    }
    if (position === 'after') {
      const nextChildren = [...children];
      nextChildren.splice(targetIndex + 1, 0, newElement);
      return { ...root, children: nextChildren };
    }
    if (position === 'inside') {
      const targetChild = children[targetIndex];
      const updatedChild = {
        ...targetChild,
        children: [...(targetChild.children || []), newElement],
      };
      const nextChildren = [...children];
      nextChildren[targetIndex] = updatedChild;
      return { ...root, children: nextChildren };
    }
  }

  return {
    ...root,
    children: children.map((child) => insertElementAt(child, targetId, newElement, position)),
  };
}

export function moveElementInTree(
  root: VisualElement,
  sourceId: string,
  targetId: string,
  position: 'before' | 'after' | 'inside'
): VisualElement {
  if (!sourceId || !targetId || sourceId === targetId || sourceId === root.id) {
    return root;
  }

  // Prevent moving a node into one of its own descendants
  if (isDescendantOf(root, sourceId, targetId)) {
    return root;
  }

  const sourceElement = findElementById(root, sourceId);
  if (!sourceElement) return root;

  // Remove source from tree first
  const treeWithoutSource = removeElementFromTree(root, sourceId);

  // Insert source at target position
  return insertElementAt(treeWithoutSource, targetId, sourceElement, position);
}

export function duplicateElementInTree(root: VisualElement, id: string): VisualElement {
  function cloneWithNewIds(el: VisualElement): VisualElement {
    const newId = `${el.tag}-${Math.random().toString(36).substr(2, 6)}`;
    return {
      ...el,
      id: newId,
      name: `${el.name} (Copy)`,
      children: (el.children || []).map(cloneWithNewIds),
    };
  }

  function traverse(current: VisualElement): VisualElement {
    const newChildren: VisualElement[] = [];
    for (const child of current.children || []) {
      if (child.id === id) {
        newChildren.push(child);
        newChildren.push(cloneWithNewIds(child));
      } else {
        newChildren.push(traverse(child));
      }
    }
    return {
      ...current,
      children: newChildren,
    };
  }

  return traverse(root);
}

export function createDefaultElement(tag: ElementTag): VisualElement {
  const rand = Math.random().toString(36).substr(2, 6);
  const id = `${tag}-${rand}`;

  switch (tag) {
    case 'h1':
      return {
        id,
        tag: 'h1',
        name: 'Heading 1',
        classes: 'text-3xl font-bold text-white mb-2',
        styles: {},
        attributes: {},
        content: 'New Heading',
        children: [],
        bindings: {},
      };
    case 'h2':
      return {
        id,
        tag: 'h2',
        name: 'Heading 2',
        classes: 'text-xl font-semibold text-slate-100 mb-2',
        styles: {},
        attributes: {},
        content: 'Section Subheading',
        children: [],
        bindings: {},
      };
    case 'p':
      return {
        id,
        tag: 'p',
        name: 'Paragraph Text',
        classes: 'text-slate-300 text-sm leading-relaxed mb-2',
        styles: {},
        attributes: {},
        content: 'This text content can point directly to a state variable or function.',
        children: [],
        bindings: {},
      };
    case 'button':
      return {
        id,
        tag: 'button',
        name: 'Interactive Button',
        classes: 'px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-sm font-medium transition cursor-pointer',
        styles: {},
        attributes: {},
        content: 'Click Action',
        children: [],
        bindings: {},
      };
    case 'input':
      return {
        id,
        tag: 'input',
        name: 'Form Input',
        classes: 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500',
        styles: {},
        attributes: {
          type: 'text',
          placeholder: 'Type value here...',
        },
        content: '',
        children: [],
        bindings: {},
      };
    case 'badge':
      return {
        id,
        tag: 'span',
        name: 'Status Badge',
        classes: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        styles: {},
        attributes: {},
        content: 'Status: Active',
        children: [],
        bindings: {},
      };
    case 'card':
      return {
        id,
        tag: 'div',
        name: 'Container Card',
        classes: 'bg-slate-800/90 border border-slate-700 rounded-xl p-5 shadow-lg',
        styles: {},
        attributes: {},
        content: '',
        children: [
          {
            id: `h3-${rand}`,
            tag: 'h3',
            name: 'Card Header',
            classes: 'text-lg font-semibold text-white mb-1',
            styles: {},
            attributes: {},
            content: 'Card Container',
            children: [],
            bindings: {},
          },
          {
            id: `p-${rand}`,
            tag: 'p',
            name: 'Card Description',
            classes: 'text-xs text-slate-400',
            styles: {},
            attributes: {},
            content: 'Contains nested child elements and bound fields.',
            children: [],
            bindings: {},
          },
        ],
        bindings: {},
      };
    case 'div':
      return {
        id,
        tag: 'div',
        name: 'Flex Row Container',
        classes: 'flex items-center gap-3 p-2',
        styles: {},
        attributes: {},
        content: '',
        children: [],
        bindings: {},
      };
    case 'progress':
      return {
        id,
        tag: 'div',
        name: 'Progress Bar Bar',
        classes: 'w-full bg-slate-700 rounded-full h-3 overflow-hidden',
        styles: {},
        attributes: {},
        content: '',
        children: [
          {
            id: `bar-${rand}`,
            tag: 'div',
            name: 'Progress Fill',
            classes: 'bg-indigo-500 h-full rounded-full transition-all duration-300',
            styles: { width: '65%' },
            attributes: {},
            content: '',
            children: [],
            bindings: {},
          },
        ],
        bindings: {},
      };
    default:
      return {
        id,
        tag: tag || 'div',
        name: `${tag.toUpperCase()} Element`,
        classes: 'p-2',
        styles: {},
        attributes: {},
        content: tag === 'span' || tag === 'label' ? 'Sample Label' : '',
        children: [],
        bindings: {},
      };
  }
}
