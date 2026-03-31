const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { loadIdOverrides } = require('./load_id_overrides');

// --- AUTO-DETECT .xlsm IN SCRIPT DIRECTORY ---
const cwd = __dirname;
const files = fs.readdirSync(cwd);

const xlsmFile = files.filter(f => f.endsWith('.xlsm')).sort().reverse()[0];
if (!xlsmFile) { console.error('Error: No .xlsm file found in current directory.'); process.exit(1); }
const excelPath = path.join(cwd, xlsmFile);

const outputPath = path.join(cwd, '..', 'nk', 'w.js');

// --- Category to w.js type number ---
function catToType(cat) {
    const map = { '发型':1, '连衣裙':2, '上装':3, '下装':4, '外套':5, '袜子':6, '鞋子':8, '妆容':9, '萤光之灵':10, '饰品':11 };
    return map[cat] || null;
}

// --- Game ID -> nikkis_choice item number (from hei sheet formula) ---
function getItemNo(id) {
    const s = String(id);
    if (s.substring(0, 2) === '18' && id > 100000) return '1' + s.substring(s.length - 4);
    const last4 = s.substring(s.length - 4);
    return last4[0] === '0' ? last4.substring(1) : last4;
}

const { hardcodeNo } = loadIdOverrides(__dirname);

// --- MAIN ---
console.log("Using xlsm:", xlsmFile);
const wb = xlsx.readFile(excelPath);

// Build depth_type -> 分类 map from 参数表 H:I
const ps = wb.Sheets['参数表'];
const depthTypeMap = {};
for (let r = 0; r < 500; r++) {
    const h = ps[xlsx.utils.encode_cell({r, c:7})];
    const i = ps[xlsx.utils.encode_cell({r, c:8})];
    if (!h || !i) break;
    depthTypeMap[h.v] = i.v;
}
console.log(`Loaded ${Object.keys(depthTypeMap).length} depth_type mappings`);

// Read clothes_data sheet
const data = xlsx.utils.sheet_to_json(wb.Sheets['clothes_data'], { header: 1 });

const wMap = {};
let count = 0, skipped = 0;

for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const id = row[0];
    if (!id || isNaN(id)) continue;

    const depthType = row[4];
    const cat = depthTypeMap[depthType];
    if (!cat) { skipped++; continue; }

    const type = catToType(cat);
    if (type === null) { skipped++; continue; }

    const itemNo = hardcodeNo[id] || getItemNo(id);
    const key = type + '.' + itemNo;

    // [华丽(21), 简约(22), 优雅(23), 活泼(24), 成熟(25), 可爱(26), 性感(27), 清纯(28), 保暖(29), 清凉(30)]
    wMap[key] = {
        id: id,
        vals: [row[21]||0, row[22]||0, row[23]||0, row[24]||0, row[25]||0,
               row[26]||0, row[27]||0, row[28]||0, row[29]||0, row[30]||0]
    };
    count++;
}

console.log(`Processed: ${count} items, skipped: ${skipped}`);
console.log(`Unique keys: ${Object.keys(wMap).length}`);

// Sort by original game ID
const sortedKeys = Object.keys(wMap).sort((a, b) => wMap[a].id - wMap[b].id);

let output = `var wardrobe_2 = [\n];\n\nvar w_adj={\n`;
for (const key of sortedKeys) {
    output += `'${key}':[${wMap[key].vals.join(',')}],\n`;
}
output += `};\n\nvar wardrobe = function() {\n\tvar ret = wardrobe;\n\tfor (var i in wardrobe_2) ret.push(wardrobe_2[i]);\n\treturn ret;\n}();\n`;

fs.writeFileSync(outputPath, output.replace(/\r\n/g, '\n'));
console.log('=> w.js written to', outputPath);
