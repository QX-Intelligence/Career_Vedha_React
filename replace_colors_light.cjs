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
    
    content = content
        .replace(/#FFF8E1/gi, 'var(--cv-primary-light)')
        .replace(/#FFECB3/gi, 'rgba(98, 38, 158, 0.15)')
        .replace(/#fffbeb/gi, 'var(--cv-primary-light)')
        .replace(/#fefce8/gi, 'var(--cv-primary-light)')
        .replace(/#fef3c7/gi, 'rgba(98, 38, 158, 0.15)')
        .replace(/#fde68a/gi, 'rgba(98, 38, 158, 0.25)')
        .replace(/#d97706/gi, 'var(--cv-primary-dark)');

    if (original !== content) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
    }
});
