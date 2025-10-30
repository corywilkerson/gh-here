/**
 * Draft management for file editing
 */

import { STORAGE_KEYS } from './constants.js';

export const DraftManager = {
  saveDraft(filePath, content) {
    localStorage.setItem(`${STORAGE_KEYS.DRAFT_PREFIX}${filePath}`, content);
  },

  loadDraft(filePath) {
    return localStorage.getItem(`${STORAGE_KEYS.DRAFT_PREFIX}${filePath}`);
  },

  clearDraft(filePath) {
    localStorage.removeItem(`${STORAGE_KEYS.DRAFT_PREFIX}${filePath}`);
  },

  hasDraftChanges(filePath, originalContent) {
    const draft = this.loadDraft(filePath);
    return draft !== null && draft !== originalContent;
  },

  getAllDrafts() {
    const drafts = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_KEYS.DRAFT_PREFIX)) {
        const filePath = key.replace(STORAGE_KEYS.DRAFT_PREFIX, '');
        drafts[filePath] = localStorage.getItem(key);
      }
    }
    return drafts;
  }
};
