const fs = require('fs');
const path = require('path');

function searchFiles(dir, pattern) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            searchFiles(file, pattern);
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.js')) {
                const content = fs.readFileSync(file, 'utf8');
                if (pattern.test(content)) {
                    console.log(`Match found in: ${file}`);
                    const lines = content.split('\n');
                    lines.forEach((line, i) => {
                        if (pattern.test(line)) {
                            console.log(`  L${i+1}: ${line.trim()}`);
                        }
                    });
                }
            }
        }
    });
}

console.log('Searching for yellow/gold in src...');
searchFiles('src', /yellow|gold/gi);
