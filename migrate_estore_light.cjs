const fs = require('fs');
const path = require('path');

const replacements = [
    // Backgrounds
    { search: /#111/gi, replace: '#FDFBF7' }, // Soft Wheat
    { search: /#1a1a1a/gi, replace: '#FFFFFF' }, // Pure White Surface
    { search: /background:\s*['"]#111['"]/gi, replace: "background: '#FDFBF7'" },
    { search: /background:\s*['"]#1a1a1a['"]/gi, replace: "background: '#FFFFFF'" },
    { search: /background:\s*['"]#000['"]/gi, replace: "background: '#FDFBF7'" },

    // Text & Contrast
    { search: /color:\s*['"]#fff['"]/gi, replace: "color: '#0F172A'" },
    { search: /color:\s*['"]#ffffff['"]/gi, replace: "color: '#0F172A'" },
    { search: /color:\s*['"]#aaa['"]/gi, replace: "color: '#475569'" },
    { search: /color:\s*['"]#666['"]/gi, replace: "color: '#94A3B8'" },
    { search: /color:\s*['"]#888['"]/gi, replace: "color: '#64748B'" },

    // Borders & Shadows (Switching from dark-mode glows to light-mode shadows)
    { search: /border:\s*['"]1px solid rgba\(255,255,255,0.05\)['"]/gi, replace: "border: '1px solid rgba(0,0,0,0.05)'" },
    { search: /box-shadow:\s*['"]0 20px 40px rgba\(0,0,0,0.4\)['"]/gi, replace: "box-shadow: '0 20px 40px rgba(0,0,0,0.1)'" },
    
    // Explicit hex codes in CSS
    { search: /background-color:\s*#111/gi, replace: 'background-color: #FDFBF7' },
    { search: /background:\s*#111/gi, replace: 'background: #FDFBF7' },
    { search: /color:\s*#fff/gi, replace: 'color: #0F172A' },
    { search: /color:\s*#ffffff/gi, replace: 'color: #0F172A' }
];

function getFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
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

const targetDirs = [
    'src/modules/_cv_sys_cache',
    'src/styles' // we only want store.css here, we'll filter
];

let allFiles = [];
targetDirs.forEach(dir => {
    allFiles = allFiles.concat(getFiles(dir));
});

// Filter specifically for E-Store related files in styles
allFiles = allFiles.filter(f => f.includes('_cv_sys_cache') || f.includes('store.css'));

allFiles.forEach(file => {
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

// Special update for store.css variables specifically
const storeCssPath = path.resolve('src/styles/store.css');
if (fs.existsSync(storeCssPath)) {
    let storeContent = fs.readFileSync(storeCssPath, 'utf8');
    storeContent = storeContent.replace(/--store-bg:\s*#111;/g, '--store-bg: #FDFBF7;');
    storeContent = storeContent.replace(/--store-surface:\s*#1a1a1a;/g, '--store-surface: #FFFFFF;');
    storeContent = storeContent.replace(/--store-text:\s*#fff;/g, '--store-text: #0F172A;');
    storeContent = storeContent.replace(/--store-text-muted:\s*#888;/g, '--store-text-muted: #64748B;');
    storeContent = storeContent.replace(/--store-border:\s*rgba\(98, 38, 158, 0.1\);/g, '--store-border: rgba(98, 38, 158, 0.08);');
    fs.writeFileSync(storeCssPath, storeContent);
    console.log('Fixed store.css variables');
}
