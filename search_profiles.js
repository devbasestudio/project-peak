const fs = require('fs');
const path = require('path');

function searchSql(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        searchSql(fullPath);
      }
    } else {
      if (file.endsWith('.sql')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.toLowerCase().includes('profiles')) {
          console.log(`Found profiles in: ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes('profiles') || line.toLowerCase().includes('onboarding')) {
              console.log(`  Line ${idx + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }
  }
}

searchSql('d:/Practice/project-peak');
