// Normalize the file name by keeping only the text before the first "(".
function normalizeGameName(name) {
  // Remove extension.
  name = name.replace(/\.[^/.]+$/, '');

  // Keep only the text before the first "(".
  name = name.split('(')[0];

  // Remove bracketed text if it exists before the "(".
  name = name.replace(/\s*\[.*?\]\s*/g, ' ');

  // Normalize spaces.
  name = name.replace(/\s{2,}/g, ' ').trim();

  return name;
}

module.exports = { normalizeGameName };
