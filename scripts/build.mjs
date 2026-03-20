import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

rmrf(dist);
fs.mkdirSync(dist, { recursive: true });

for (const file of ['index.html', 'app.js', 'styles.css']) {
  copyRecursive(path.join(root, file), path.join(dist, file));
}
copyRecursive(path.join(root, 'data'), path.join(dist, 'data'));
if (fs.existsSync(path.join(root, 'assets'))) copyRecursive(path.join(root, 'assets'), path.join(dist, 'assets'));

console.log('Built dist/');
