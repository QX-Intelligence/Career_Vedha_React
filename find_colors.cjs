const fs = require('fs');
const path = require('path');

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

const files = getFiles('src/modules/_cv_sys_cache');
const hexRegex = /#[0-9A-Fa-f]{3,6}/gi;
const hexCodes = new Set();

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = hexRegex.exec(content)) !== null) {
        hexCodes.add(match[0].toUpperCase());
    }
});

console.log('Hex Codes Found:');
console.log(Array.from(hexCodes).sort());
