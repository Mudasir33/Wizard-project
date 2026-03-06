const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'Frontend', 'website', 'dist');
const targetDir = path.join(projectRoot, 'Public');

if (!fs.existsSync(sourceDir)) {
  console.error(`Build output not found: ${sourceDir}`);
  console.error('Run "npm --prefix Frontend/website run build" first.');
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Copied website build from ${sourceDir} to ${targetDir}`);
