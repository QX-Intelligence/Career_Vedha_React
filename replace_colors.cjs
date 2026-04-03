const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.css') || file.endsWith('.jsx') || file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}

const targetFiles = walk(path.join(__dirname, 'src'));

targetFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace hex codes in CSS
    if (file.endsWith('.css')) {
        content = content
            .replace(/#FFC107/gi, 'var(--cv-primary)')
            .replace(/#FFB300/gi, 'var(--cv-primary-dark)')
            .replace(/rgba\(255,\s*193,\s*7,\s*([0-9.]+)\)/gi, 'rgba(98, 38, 158, $1)');
    }
    
    // Replace hardcoded placehold.it links in JSX/TSX
    if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        content = content.replace(/FFC107/g, '62269E');
    }

    if (original !== content) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
    }
});
