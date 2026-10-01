/** A single file rendered by Pierre Diffs, virtualized against a scroll root. */
import {
  DEFAULT_VIRTUAL_FILE_METRICS,
  VirtualizedFile,
  Virtualizer,
} from '@pierre/diffs';

import { lineHeight, viewerOptions } from '../settings.js';

/** Height of the sticky .file-toolbar, so selected lines land below it. */
const HEADER_HEIGHT = 46;

export function renderCode(
  container,
  file,
  { scrollRoot, selected, onSelect },
) {
  const virtualizer = new Virtualizer();
  virtualizer.setup(scrollRoot);
  let scrolledToSelection = false;
  let selectionFrame;

  // Once the first render lands, highlight a linked selection and scroll it into view.
  const revealSelection = () => {
    if (!selected || scrolledToSelection) return;
    scrolledToSelection = true;
    selectionFrame = requestAnimationFrame(() => {
      viewer.setSelectedLines(selected);
      const position = viewer.getLinePosition(selected.start);
      if (position)
        virtualizer.scrollTo({
          top: position.top + HEADER_HEIGHT - scrollRoot.clientHeight / 3,
        });
    });
  };
  const options = () => ({
    ...viewerOptions(),
    disableFileHeader: true,
    enableLineSelection: true,
    onLineSelected: onSelect,
    onPostRender: revealSelection,
  });

  const viewer = new VirtualizedFile(options(), virtualizer, {
    ...DEFAULT_VIRTUAL_FILE_METRICS,
    lineHeight: lineHeight(),
  });
  viewer.render({
    file: { name: file.path, contents: file.contents },
    containerWrapper: container,
  });
  return {
    update: () => viewer.setOptions(options()),
    destroy() {
      cancelAnimationFrame(selectionFrame);
      viewer.cleanUp();
      virtualizer.cleanUp();
    },
  };
}
