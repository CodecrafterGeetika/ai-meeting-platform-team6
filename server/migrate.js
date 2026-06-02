import fs from 'fs';
import path from 'path';

const srcDir = './src';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace `const { a, b } = require('lib');`
  let counter = 0;
  content = content.replace(/const\s+(\{[^}]+\})\s*=\s*require\((['"])([^'"]+)\2\);?/g, (match, p1, quote, modulePath) => {
    counter++;
    const tempName = `_import${counter}`;
    return `import ${tempName} from '${resolveExtension(filePath, modulePath)}';\nconst ${p1} = ${tempName};`;
  });

  // Replace `const xyz = require('lib');`
  content = content.replace(/const\s+([A-Za-z0-9_]+)\s*=\s*require\((['"])([^'"]+)\2\);?/g, (match, p1, quote, modulePath) => {
    return `import ${p1} from '${resolveExtension(filePath, modulePath)}';`;
  });

  // Replace `require('lib');` without assignment
  content = content.replace(/(?<!const\s+[A-Za-z0-9_\{\}\s]+\s*=\s*)require\((['"])([^'"]+)\1\);?/g, (match, quote, modulePath) => {
    return `import '${resolveExtension(filePath, modulePath)}';`;
  });

  // Replace `module.exports = { ... };` with `export default { ... };`
  // We match from `module.exports = ` to the end of the file
  content = content.replace(/module\.exports\s*=\s*(\{[\s\S]*\}\s*);?(\s*)$/m, (match, p1, trailing) => {
    return `export default ${p1};${trailing}`;
  });

  // Replace `module.exports = xyz;` with `export default xyz;`
  content = content.replace(/module\.exports\s*=\s*([A-Za-z0-9_]+);?(\s*)$/m, (match, p1, trailing) => {
    return `export default ${p1};${trailing}`;
  });

  // Replace `__dirname`
  content = content.replace(/__dirname/g, 'import.meta.dirname');

  fs.writeFileSync(filePath, content, 'utf8');
}

function resolveExtension(currentFilePath, importPath) {
  if (!importPath.startsWith('.')) return importPath;

  const currentDir = path.dirname(currentFilePath);
  const targetPath = path.resolve(currentDir, importPath);

  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      return importPath.endsWith('/') ? importPath + 'index.js' : importPath + '/index.js';
    }
  }
  
  if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
    return importPath + '.js';
  }

  return importPath;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.js')) {
      processFile(filePath);
    }
  }
}

walkDir(srcDir);
console.log('Migration completed.');
