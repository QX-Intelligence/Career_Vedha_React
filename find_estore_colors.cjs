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

const files = [...getFiles('src/modules/_cv_sys_cache'), 'src/styles/store.css'];
const darkRegex = /#(111|1a1a1a|000|0a0a0a|161616|121212)/gi;
const whiteRegex = /#(fff|ffffff)/gi;

files.forEach(file => {
    const fullPath = path.resolve(file);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (darkRegex.test(line) || whiteRegex.test(line)) {
            console.log(`${file}:L${i+1}: ${line.trim()}`);
        }
    });
});
