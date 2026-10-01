import DOMPurify from 'dompurify';
import { marked } from 'marked';

import { fileUrl, parentPath } from './format.js';

export function renderMarkdown(container, contents, path) {
  const fragment = DOMPurify.sanitize(marked.parse(contents), {
    RETURN_DOM_FRAGMENT: true,
    FORBID_TAGS: ['style', 'input', 'form', 'iframe', 'video', 'audio'],
    FORBID_ATTR: ['style', 'srcset'],
  });
  const base = new URL(`${parentPath(path)}/`, 'http://local/');
  for (const anchor of fragment.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href');
    if (href.startsWith('#')) continue;
    if (/^(https?:|mailto:)/i.test(href)) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    } else {
      const target = new URL(href, base);
      if (target.origin !== base.origin) {
        anchor.removeAttribute('href');
        continue;
      }
      anchor.dataset.path = decodePath(target.pathname);
      anchor.href = fileUrl(anchor.dataset.path) + target.hash;
    }
  }
  for (const image of fragment.querySelectorAll('img')) {
    const src = image.getAttribute('src') || '';
    const target = new URL(src, base);
    if (target.origin !== base.origin) {
      image.replaceWith(document.createTextNode(image.alt || 'External image'));
    } else {
      image.src = `/image?path=${encodeURIComponent(decodePath(target.pathname))}`;
      image.loading = 'lazy';
    }
  }
  container.replaceChildren(fragment);
}

function decodePath(pathname) {
  const path = pathname.slice(1);
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}
