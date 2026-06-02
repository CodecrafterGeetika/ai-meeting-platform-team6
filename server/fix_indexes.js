import fs from 'fs';
import path from 'path';

const srcDir = './src';

function processIndex(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const imports = [];
  const exportsList = [];

  const lines = content.split('\n');
  const newLines = [];

  for (const line of lines) {
    const match = line.match(/module\.exports\.([A-Za-z0-9_]+)\s*=\s*import\s*['"]([^'"]+)['"];?/);
    if (match) {
      changed = true;
      const exportName = match[1];
      const importPath = match[2];
      imports.push(`import ${exportName} from '${importPath}';`);
      exportsList.push(exportName);
    } else {
      newLines.push(line);
    }
  }

  if (changed) {
    let finalContent = imports.join('\n') + '\n\n' + newLines.join('\n');
    if (exportsList.length > 0) {
      finalContent += `\nexport default {\n  ${exportsList.join(',\n  ')}\n};\n`;
    }
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.js')) {
      processIndex(filePath);
    }
  }
}

walkDir(srcDir);
