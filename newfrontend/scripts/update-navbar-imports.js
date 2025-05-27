const fs = require('fs');
const path = require('path');

// List of files to update
const filesToUpdate = [
  'src/app/test-type/[category]/page.tsx',
  'src/app/test-type/page.tsx',
  'src/app/test-files/page.tsx',
  'src/app/pricing/page.tsx',
  'src/app/page.tsx',
  'src/app/features/page.tsx',
  'src/app/environments/configure/page.tsx',
  'src/app/environment/page.tsx',
  'src/app/documentation/page.tsx',
  'src/app/docs/getting-started/page.tsx',
  'src/app/docs/cli/page.tsx',
  'src/app/docs/api/page.tsx',
  'src/app/demo/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/custom-flow/page.tsx',
  'src/app/contact/page.tsx',
];

// Update each file
filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    // Read the file
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace the import and usage of Navbar with NewNavbar
    const updatedContent = content
      .replace(
        /import\s+\{\s*Navbar\s*\}\s*from\s*['"]@\/components\/layout\/Navbar['"]/,
        'import { NewNavbar } from "@/components/layout/NewNavbar"'
      )
      .replace(/<Navbar\s*\/>/g, '<NewNavbar />');
    
    // Write the updated content back to the file
    fs.writeFileSync(fullPath, updatedContent, 'utf8');
    console.log(`Updated ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
});

console.log('Navbar imports updated successfully!');
