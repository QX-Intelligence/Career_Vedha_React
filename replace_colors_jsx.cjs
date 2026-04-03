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
            if (file.endsWith('.jsx') || file.endsWith('.tsx')) results.push(file);
        }
    });
    return results;
}

const targetFiles = walk(path.join(__dirname, 'src'));

targetFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace hex codes in JSX
    content = content
        .replace(/#f59e0b/gi, 'var(--cv-primary)')
        .replace(/#fbbf24/gi, 'var(--cv-primary)')
        // We only do these two mostly as they are the gold/amber colors used for icons.
        // #d97706 is sometimes used for borders of warning boxes. Let's make it purple too.
        .replace(/#d97706/gi, 'var(--cv-primary-dark)')
        // ffc107 and ffb300 shouldn't be here since the previous script replaced them if they existed, wait, the previous script DIDN'T replace them in jsx!
        .replace(/#FFC107/gi, 'var(--cv-primary)')
        .replace(/#FFB300/gi, 'var(--cv-primary-dark)');

    if (original !== content) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
    }
});
