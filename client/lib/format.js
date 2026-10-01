/** Pure formatting for paths, sizes, dates and counts. */

export const fileUrl = (path) => `/?path=${encodeURIComponent(path)}`;

export const parentPath = (path) => path.split('/').slice(0, -1).join('/');

export const sizeLabel = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const dateLabel = (date) => dateFormat.format(new Date(date));

export const plural = (count, word) =>
  `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`;
