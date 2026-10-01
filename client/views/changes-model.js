/**
 * Turns the server's changed files into CodeView items, in tree order,
 * plus the totals shown in the sidebar. Pure: no DOM, no fetching.
 */
import { parseDiffFromFile } from '@pierre/diffs';

const pathOrder = new Intl.Collator(undefined, { numeric: true });

// Lockfiles start collapsed: they are long, generated, and rarely reviewed.
const GENERATED =
  /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|Cargo\.lock|Gemfile\.lock|composer\.lock|poetry\.lock|uv\.lock)$/;

export function buildReview({ branch, files }) {
  const changes = [...files].sort(treeOrder);
  const items = changes.map(toItem);
  const notes = new Map(changes.map((change) => [change.path, note(change)]));
  let additions = 0;
  let deletions = 0;
  for (const { fileDiff } of items)
    for (const hunk of fileDiff.hunks) {
      additions += hunk.additionLines;
      deletions += hunk.deletionLines;
    }
  return {
    changes,
    items,
    notes,
    summary: { branch, files: items.length, additions, deletions },
  };
}

/** The tree lists folders before files at every level; the review follows it. */
function treeOrder(a, b) {
  const left = a.path.split('/');
  const right = b.path.split('/');
  let i = 0;
  while (left[i] === right[i]) i++;
  const leftFolder = i < left.length - 1;
  const rightFolder = i < right.length - 1;
  if (leftFolder !== rightFolder) return leftFolder ? -1 : 1;
  return pathOrder.compare(left[i], right[i]);
}

/** A short header note for changes that have no readable text diff. */
function note(change) {
  if (change.unsupported) return 'Not a regular file';
  if (change.tooLarge) return 'Skipped, review is too large';
  const kinds = [change.oldFile.kind, change.newFile.kind];
  if (kinds.includes('binary')) return 'Binary file';
  if (kinds.includes('large')) return 'Too large to diff';
  if (
    change.status === 'M' &&
    change.oldFile.contents === change.newFile.contents
  )
    return 'Mode or staging change only';
  return undefined;
}

function toItem(change) {
  const text =
    change.oldFile?.kind === 'text' && change.newFile?.kind === 'text';
  const side = (file) => ({
    name: file?.path ?? change.path,
    contents: text ? file.contents : '',
  });
  return {
    id: change.path,
    type: 'diff',
    fileDiff: parseDiffFromFile(
      change.status === 'A' ? null : side(change.oldFile),
      change.status === 'D' ? null : side(change.newFile),
    ),
    collapsed: change.status === 'D' || GENERATED.test(change.path),
    version: 0,
  };
}
