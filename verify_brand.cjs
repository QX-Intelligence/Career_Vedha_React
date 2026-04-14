const fs = require('fs');
const path = require('path');

function searchFiles(dir, patterns) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            searchFiles(file, patterns);
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.js')) {
                const content = fs.readFileSync(file, 'utf8');
                patterns.forEach(p => {
                    if (p.test(content)) {
                        console.log(`Match [${p}] in: ${file}`);
                    }
                });
            }
        }
    });
}

const patterns = [
    /#D4A843/gi,
    /primary-yellow/gi,
    /rgba\(212,\s*168,\s*67/gi,
    /rgba\(250,\s*204,\s*21/gi
];

console.log('Final verification search in src...');
searchFiles('src', patterns);
