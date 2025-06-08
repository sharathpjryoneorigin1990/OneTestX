import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Files to rename (from -> to)
const filesToRename = [
  { from: 'alert.tsx', to: 'Alert.tsx' },
  { from: 'badge.tsx', to: 'Badge.tsx' },
  { from: 'button.tsx', to: 'Button.tsx' },
  { from: 'card.tsx', to: 'Card.tsx' },
  { from: 'input.tsx', to: 'Input.tsx' },
  { from: 'label.tsx', to: 'Label.tsx' },
  { from: 'select.tsx', to: 'Select.tsx' },
  { from: 'switch.tsx', to: 'Switch.tsx' },
  { from: 'tabs.tsx', to: 'Tabs.tsx' },
  { from: 'toast.tsx', to: 'Toast.tsx' },
  { from: 'toast-provider.tsx', to: 'ToastProvider.tsx' },
];

const componentsDir = path.join(process.cwd(), 'src/components/ui');

// 1. First, rename all files to use PascalCase
console.log('Renaming files to use PascalCase...');
filesToRename.forEach(({ from, to }) => {
  const fromPath = path.join(componentsDir, from);
  const toPath = path.join(componentsDir, to);
  
  if (fs.existsSync(fromPath) && !fs.existsSync(toPath)) {
    fs.renameSync(fromPath, toPath);
    console.log(`Renamed ${from} to ${to}`);
  } else if (!fs.existsSync(fromPath)) {
    console.log(`Skipping ${from} - file not found`);
  } else {
    console.log(`Skipping ${from} - ${to} already exists`);
  }
});

// 2. Update imports in all files
console.log('\nUpdating imports...');
const srcDir = path.join(process.cwd(), 'src');

const updateImportsInFile = (filePath: string) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let updated = false;

  filesToRename.forEach(({ from, to }) => {
    const fromName = from.replace(/\.tsx$/, '');
    const toName = to.replace(/\.tsx$/, '');
    
    // Update both single and double quotes, with or without .tsx extension
    const patterns = [
      { from: `'./${fromName}'`, to: `'./${toName}'` },
      { from: `"./${fromName}"`, to: `"./${toName}"` },
      { from: `'./${fromName}.tsx'`, to: `'./${toName}'` },
      { from: `"./${fromName}.tsx"`, to: `"./${toName}"` },
      { from: `from '@/components/ui/${fromName}'`, to: `from '@/components/ui/${toName}'` },
      { from: `from "@/components/ui/${fromName}"`, to: `from "@/components/ui/${toName}"` },
      { from: `from '@/components/ui/${fromName}.tsx'`, to: `from '@/components/ui/${toName}'` },
      { from: `from "@/components/ui/${fromName}.tsx"`, to: `from "@/components/ui/${toName}"` },
    ];

    patterns.forEach(({ from: patternFrom, to: patternTo }) => {
      if (content.includes(patternFrom)) {
        content = content.replace(new RegExp(escapeRegExp(patternFrom), 'g'), patternTo);
        updated = true;
      }
    });
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated imports in ${path.relative(process.cwd(), filePath)}`);
  }
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Find all TypeScript and JavaScript files in the src directory
const findFiles = (dir: string): string[] => {
  const files = fs.readdirSync(dir);
  let results: string[] = [];
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(fullPath));
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      results.push(fullPath);
    }
  });
  
  return results;
};

// Process all files
const allFiles = findFiles(srcDir);
allFiles.forEach(file => {
  updateImportsInFile(file);
});

console.log('\nDone! All files have been updated to use consistent PascalCase component imports.');
