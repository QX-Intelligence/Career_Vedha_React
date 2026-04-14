const fs = require('fs');
const path = require('path');

const replacements = [
    { search: /#D4A843/gi, replace: '#62269E' },
    { search: /#ecc94b/gi, replace: '#62269E' },
    { search: /#fcd34d/gi, replace: '#62269E' },
    { search: /#facc15/gi, replace: '#62269E' },
    { search: /#fbbf24/gi, replace: '#62269E' },
    { search: /#92400e/gi, replace: '#4b1d7d' }, // Darker purple for text
    { search: /#f59e0b/gi, replace: '#62269E' },
    { search: /rgba\(212,\s*168,\s*67/gi, replace: 'rgba(98, 38, 158' },
    { search: /rgba\(250,\s*204,\s*21/gi, replace: 'rgba(123, 63, 228' },
    { search: /var\(--primary-yellow\)/gi, replace: 'var(--cv-primary)' },
    { search: /var\(--primary-yellow-hover\)/gi, replace: 'var(--cv-primary-dark)' },
    { search: /var\(--primary-yellow-light\)/gi, replace: 'var(--cv-primary-light)' },
    { search: /var\(--primary-yellow-dark\)/gi, replace: 'var(--cv-primary-dark)' },
    { search: /var\(--dark-yellow\)/gi, replace: 'var(--cv-primary-dark)' },
    { search: /var\(--light-yellow\)/gi, replace: 'var(--cv-primary-light)' }
];

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = getFiles('src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    replacements.forEach(r => {
        content = content.replace(r.search, r.replace);
    });
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated: ${file}`);
    }
});
