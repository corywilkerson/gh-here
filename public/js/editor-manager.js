/**
 * Monaco Editor management
 */

import { CONFIG, EDITOR_OPTIONS } from './constants.js';
import { getLanguageFromExtension } from './utils.js';
import { DraftManager } from './draft-manager.js';
import { showDraftDialog } from './modal-manager.js';
import { showNotification } from './notification.js';

export class EditorManager {
  constructor(theme) {
    this.fileEditor = null;
    this.newFileEditor = null;
    this.theme = theme;
    this.ready = false;
    this.init();
  }

  init() {
    if (typeof require === 'undefined') {
      return;
    }

    require.config({ paths: { vs: CONFIG.MONACO_CDN } });

    require(['vs/editor/editor.main'], () => {
      self.MonacoEnvironment = {
        getWorker: () => undefined
      };

      const monacoTheme = this.theme === 'dark' ? 'vs-dark' : 'vs';
      monaco.editor.setTheme(monacoTheme);

      this.initializeNewFileEditor();
      this.ready = true;
      window.monacoReady = true;
    });
  }

  initializeNewFileEditor() {
    const container = document.getElementById('new-file-content');
    if (!container) {
      return;
    }

    const monacoTheme = this.theme === 'dark' ? 'vs-dark' : 'vs';
    this.newFileEditor = monaco.editor.create(container, {
      ...EDITOR_OPTIONS,
      value: '',
      language: 'plaintext',
      theme: monacoTheme
    });
  }

  async createFileEditor(container, filePath, originalContent) {
    if (!this.ready) {
      await this.waitForReady();
    }

    const filename = filePath.split('/').pop() || 'file.txt';
    const language = getLanguageFromExtension(filename);
    const availableLanguages = monaco.languages.getLanguages().map(lang => lang.id);
    const validLanguage = availableLanguages.includes(language) ? language : 'plaintext';
    const monacoTheme = this.theme === 'dark' ? 'vs-dark' : 'vs';

    let contentToLoad = originalContent;

    if (DraftManager.hasDraftChanges(filePath, originalContent)) {
      const draftChoice = await showDraftDialog(filePath);
      if (draftChoice === 'load') {
        contentToLoad = DraftManager.loadDraft(filePath);
      } else if (draftChoice === 'discard') {
        DraftManager.clearDraft(filePath);
      }
    } else {
      const draft = DraftManager.loadDraft(filePath);
      if (draft && draft === originalContent) {
        DraftManager.clearDraft(filePath);
      }
    }

    if (!this.fileEditor) {
      this.fileEditor = monaco.editor.create(container, {
        ...EDITOR_OPTIONS,
        value: contentToLoad,
        language: validLanguage,
        theme: monacoTheme
      });

      this.fileEditor.onDidChangeModelContent(() => {
        DraftManager.saveDraft(filePath, this.fileEditor.getValue());
      });
    } else {
      this.fileEditor.setValue(contentToLoad);
      const model = this.fileEditor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, validLanguage);
      }
    }

    setTimeout(() => this.fileEditor.layout(), 50);

    return this.fileEditor;
  }

  waitForReady() {
    return new Promise(resolve => {
      const check = () => {
        if (this.ready) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  updateLanguage(filename) {
    if (this.newFileEditor) {
      const language = getLanguageFromExtension(filename);
      const model = this.newFileEditor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }

  toggleWordWrap(editor) {
    if (!editor) {
      return false;
    }

    const currentWrap = editor.getOption(monaco.editor.EditorOption.wordWrap);
    const newWrap = currentWrap === 'off' ? 'on' : 'off';
    editor.updateOptions({ wordWrap: newWrap });
    return newWrap === 'on';
  }

  getValue(editorType = 'file') {
    const editor = editorType === 'file' ? this.fileEditor : this.newFileEditor;
    return editor ? editor.getValue() : '';
  }

  focus(editorType = 'file') {
    const editor = editorType === 'file' ? this.fileEditor : this.newFileEditor;
    if (editor) {
      editor.focus();
    }
  }

  layout(editorType = 'file') {
    const editor = editorType === 'file' ? this.fileEditor : this.newFileEditor;
    if (editor) {
      editor.layout();
    }
  }
}
