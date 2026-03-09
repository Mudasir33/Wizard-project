const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'Frontend', 'website', 'dist');
const targetDir = path.join(projectRoot, 'Public');

function clearDirectoryContents(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);
    fs.rmSync(entryPath, { recursive: true, force: true });
  }
}

function copyDirectoryContents(sourcePath, destinationPath) {
  fs.mkdirSync(destinationPath, { recursive: true });

  for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
    const sourceEntryPath = path.join(sourcePath, entry.name);
    const destinationEntryPath = path.join(destinationPath, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryContents(sourceEntryPath, destinationEntryPath);
      continue;
    }

    fs.copyFileSync(sourceEntryPath, destinationEntryPath);
  }
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Build output not found: ${sourceDir}`);
  console.error('Run "npm --prefix Frontend/website run build" first.');
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
clearDirectoryContents(targetDir);
copyDirectoryContents(sourceDir, targetDir);

console.log(`Copied website build from ${sourceDir} to ${targetDir}`);
