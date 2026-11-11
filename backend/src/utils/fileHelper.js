const fs = require('fs/promises');
const path = require('path');

const uploadDirectory = path.resolve(__dirname, '../../uploads/competitions');

function buildFileUrl(filename) {
  return `/uploads/competitions/${filename}`;
}

async function deleteFile(filePath) {
  if (!filePath || typeof filePath !== 'string') return;
  const filename = path.basename(filePath);
  const resolvedPath = path.resolve(uploadDirectory, filename);
  if (path.dirname(resolvedPath) !== uploadDirectory) return;
  try {
    await fs.unlink(resolvedPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

module.exports = { buildFileUrl, deleteFile };
