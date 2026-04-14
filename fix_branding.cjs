const fs = require('fs');
const path = require('path');

const files = [
    'src/modules/_cv_sys_cache/pages/Module_Entry.jsx',
    'src/modules/_cv_sys_cache/pages/Module_List.jsx',
    'src/modules/_cv_sys_cache/pages/Module_View.jsx',
    'src/modules/_cv_sys_cache/pages/Module_Login.jsx',
    'src/modules/_cv_sys_cache/Module_Styles.css',
    'src/modules/_cv_sys_cache/admin/pages/AdminOrders.jsx',
    'src/styles/UserManagement.css',
    'src/styles/store.css',
    'src/components/utils/DomainGuard.jsx'
];

const GOLD = /#D4A843/gi;
const PURPLE = '#62269E';
const GOLD_RGBA = /rgba\(212,\s*168,\s*67/gi;
const PURPLE_RGBA = 'rgba(98, 38, 158';

files.forEach(file => {
    const fullPath = path.resolve(__dirname, file);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${file}`);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(GOLD, PURPLE);
    content = content.replace(GOLD_RGBA, PURPLE_RGBA);
    content = content.replace(/Career Vedha logo\.png/gi, 'Career Vedha logo1.png');
    fs.writeFileSync(fullPath, content);
    console.log(`Updated: ${file}`);
});
