/**
 * comp_wardrobe.js — same as maint.js static_generate() with staticMode == 'wardrobe', no unique key matching.
 *
 * derive row in wardrobe1 format (first 15 columns) from xlsm clothes_data using make_wardrobe1 rules,
 * then construct v for each row:
 *   v = name + category + parseInt(itemNo) + rare + zeroIfBlank(华丽)...zeroIfBlank(保暖) + (join only when tag without '+')
 *
 * put all v from xlsm into Set; for each wardrobe1 row, if not in Set, it is a mismatch
 * (game developer may have changed name/category/itemNo/rare/attributes/tag etc.).
 *
 * does not output when v is in xlsm but not in wardrobe1.
 *
 * name: clothes_data col B + F品白名单 col O/P -> [夜]/[昼] suffix.
 *
 * mismatch: lookup xlsm by category + itemNo, print clothes_data row with the same itemNo:
 *   xlsm id=... v="..." and first 15 columns (for easy comparison with wardrobe1).
 * make_wardrobe1.js only has id->row, getItemNo forward; reverse lookup table only built in this script.
 *
 * Writes: output/comp_wardrobe_report.txt
 */

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { loadIdOverrides } = require('./load_id_overrides');
const { loadDayNightWhitelist, displayClothesName, escapeForWardrobeLine } = require('./wardrobe_display_name');

const scriptDir = __dirname;
const nikkisDir = path.resolve(scriptDir, '../../nikkis_choice');
const wardrobe1Path = path.join(nikkisDir, 'data', 'wardrobe1.js');

function getItemNo(id) {
    const s = String(id);
    if (s.substring(0, 2) === '18' && id > 100000) return '1' + s.substring(s.length - 4);
    const last4 = s.substring(s.length - 4);
    return last4[0] === '0' ? last4.substring(1) : last4;
}

const { hardcodeNo } = loadIdOverrides(scriptDir);

function getWardrobe1Category(cat, depthType, depthTypeToSubtype) {
    const subType = depthTypeToSubtype[depthType];
    if (cat === '袜子') return subType === '袜套' ? '袜子-袜套' : '袜子-袜子';
    if (cat === '饰品' && subType) return '饰品-' + subType.replace(/\*/g, '·');
    return cat;
}

/** maint.js static_generate wardrobe */
function zeroIfBlank(str) {
    if (str === '' || str == null) return '0';
    return String(str);
}

/** w must have at least index 0..14 (consistent with wardrobe1 row); v doesn't use index 15..19 */
function wardrobeSignature(w) {
    const tag = String(w[14] == null ? '' : w[14]);
    let v = String(w[0]) + String(w[1]) + parseInt(String(w[2]), 10) + String(w[3] == null ? '' : w[3]);
    for (let j = 4; j < 14; j++) v += zeroIfBlank(w[j]);
    v += tag.indexOf('+') < 0 ? tag : '';
    return v;
}

function loadWardrobe1() {
    if (!fs.existsSync(wardrobe1Path)) {
        console.error(`Error: wardrobe1.js not found at ${wardrobe1Path}`);
        process.exit(1);
    }
    const raw = fs.readFileSync(wardrobe1Path, 'utf8');
    const m = raw.match(/var\s+wardrobe1\s*=\s*\[/);
    if (!m) {
        console.error('Cannot parse wardrobe1.js (missing var wardrobe1 = [)');
        process.exit(1);
    }
    let wardrobe1;
    try {
        const startIdx = m.index;
        const code = raw.substring(startIdx).replace('var wardrobe1', 'wardrobe1');
        wardrobe1 = null;
        eval(code);
    } catch (e) {
        console.error('Failed to eval wardrobe1.js:', e.message);
        process.exit(1);
    }
    return wardrobe1;
}

const srcDir = path.join(__dirname, 'src');
const dirFiles = fs.readdirSync(srcDir);
const xlsmFile = dirFiles.filter((f) => f.endsWith('.xlsm') && !f.startsWith('~$')).sort().reverse()[0];
if (!xlsmFile) {
    console.error('Error: No .xlsm file found in src/ directory.');
    process.exit(1);
}
const excelPath = path.join(srcDir, xlsmFile);

const wb = xlsx.readFile(excelPath);
const { nightIds, dayIds, sheetFound: fWhitelistFound } = loadDayNightWhitelist(wb);
const ps = wb.Sheets['参数表'];
const clothesSheet = wb.Sheets['clothes_data'];
if (!ps || !clothesSheet) {
    console.error('Error: need 参数表 and clothes_data sheets.');
    process.exit(1);
}

const depthTypeMap = {};
for (let r = 0; r < 500; r++) {
    const h = ps[xlsx.utils.encode_cell({ r, c: 7 })];
    const i = ps[xlsx.utils.encode_cell({ r, c: 8 })];
    if (!h || !i) break;
    depthTypeMap[h.v] = i.v;
}

const tagMap = {};
for (let r = 0; r < 100; r++) {
    const a = ps[xlsx.utils.encode_cell({ r, c: 0 })];
    const b = ps[xlsx.utils.encode_cell({ r, c: 1 })];
    if (a && b && typeof a.v === 'number') tagMap[a.v] = b.v;
}

const gradeTable = {};
for (let r = 0; r < 300; r++) {
    const l = ps[xlsx.utils.encode_cell({ r, c: 11 })];
    const m = ps[xlsx.utils.encode_cell({ r, c: 12 })];
    if (!l) break;
    gradeTable[l.v] = m.v;
}

const divisorMap = {};
for (let r = 0; r < 20; r++) {
    const o = ps[xlsx.utils.encode_cell({ r, c: 14 })];
    const p = ps[xlsx.utils.encode_cell({ r, c: 15 })];
    if (o && p) divisorMap[o.v] = p.v;
}

const depthTypeToSubtype = {};
for (let r = 0; r < 500; r++) {
    const h = ps[xlsx.utils.encode_cell({ r, c: 7 })];
    const j = ps[xlsx.utils.encode_cell({ r, c: 9 })];
    if (!h) break;
    if (j) depthTypeToSubtype[h.v] = j.v;
}

function valueToGrade(rawValue, divisor) {
    if (!rawValue || rawValue === 0) return '';
    const scaled = Math.round(rawValue / divisor - 0.001);
    if (scaled <= 0) return '';
    if (gradeTable[scaled]) return gradeTable[scaled];
    const maxKey = Math.max(...Object.keys(gradeTable).map(Number));
    if (scaled > maxKey) return gradeTable[maxKey] || 'SSS';
    return '';
}

const clothesData = xlsx.utils.sheet_to_json(clothesSheet, { header: 1 });

/**
 * Construct an array with the same format as wardrobe1 row (first 15 columns) from clothes_data row i, for wardrobeSignature.
 * @returns {{ gameId: number, w: string[] } | null}
 */
function syntheticWardrobeRowFromXlsm(i) {
    const row = clothesData[i];
    const id = row[0];
    const baseName = row[1];
    const depthType = row[4];
    if (id == null || id === '' || !baseName) return null;
    const cat = depthTypeMap[depthType];
    if (!cat) return null;
    const displayCat = getWardrobe1Category(cat, depthType, depthTypeToSubtype);
    const divisor = divisorMap[cat];
    if (!divisor) return null;

    const rare = row[13];
    const special1 = row[15];
    const special2 = row[16];
    const rawAttrs = [
        row[21] || 0, row[22] || 0, row[23] || 0, row[24] || 0,
        row[25] || 0, row[26] || 0, row[27] || 0, row[28] || 0,
        row[30] || 0, row[29] || 0,
    ];
    const grades = rawAttrs.map((v) => valueToGrade(v, divisor));
    const tag1Name = special1 ? (tagMap[special1] || '') : '';
    const tag2Name = special2 ? (tagMap[special2] || '') : '';
    const tagStr = [tag1Name, tag2Name].filter(Boolean).join('/');
    const itemNo = String(hardcodeNo[id] || getItemNo(Number(id)));
    const displayName = displayClothesName(row, id, nightIds, dayIds);

    const w = [];
    w[0] = displayName;
    w[1] = String(displayCat);
    w[2] = itemNo;
    w[3] = rare != null && rare !== '' ? String(rare) : '';
    for (let g = 0; g < 10; g++) w[4 + g] = grades[g] != null ? String(grades[g]) : '';
    w[14] = tagStr;
    return { gameId: Number(id), w };
}

/** cat+itemNo -> all matching xlsm rows (usually 1) */
/** @type {Map<string, { gameId: number, v: string, w: string[] }[]>} */
const byCategoryAndItemNo = new Map();

/** @type {Set<string>} */
const vFromXlsm = new Set();
let skippedXlsm = 0;
let duplicateVCount = 0;

for (let i = 1; i < clothesData.length; i++) {
    const hit = syntheticWardrobeRowFromXlsm(i);
    if (!hit) {
        skippedXlsm++;
        continue;
    }
    const { gameId, w } = hit;
    const v = wardrobeSignature(w);
    if (vFromXlsm.has(v)) duplicateVCount++;
    vFromXlsm.add(v);

    const catNoKey = `${w[1]}\0${w[2]}`;
    if (!byCategoryAndItemNo.has(catNoKey)) byCategoryAndItemNo.set(catNoKey, []);
    byCategoryAndItemNo.get(catNoKey).push({ gameId, v, w });
}

const wardrobe1 = loadWardrobe1();
const mismatches = [];

for (let wi = 0; wi < wardrobe1.length; wi++) {
    const row = wardrobe1[wi];
    const v = wardrobeSignature(row);
    if (!vFromXlsm.has(v)) {
        const catNoKey = `${String(row[1])}\0${String(row[2])}`;
        const xlsmSameCatNo = byCategoryAndItemNo.get(catNoKey) || [];
        mismatches.push({
            wi,
            v,
            line: `  ['${row.join("','")}'],`,
            xlsmSameCatNo,
            cat: String(row[1]),
            itemNo: String(row[2]),
        });
    }
}

const outputPath = path.join(scriptDir, 'output', 'comp_wardrobe_report.txt');
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

let fileBody = `// comp_wardrobe.js — vlookup: wardrobe1.row not in xlsm-derived set\n`;
fileBody += `// xlsm: ${xlsmFile}\n`;
fileBody += `// F品白名单: ${fWhitelistFound ? `${nightIds.size} Ye / ${dayIds.size} Zhou id` : 'not found'}\n`;
fileBody += `// xlsm size: ${vFromXlsm.size} | clothes_data skipped: ${skippedXlsm}\n`;
fileBody += `// xlsm duplicate count: ${duplicateVCount}\n`;
fileBody += `// wardrobe1 rows: ${wardrobe1.length}\n`;
fileBody += `// mismatch (v not in xlsm set): ${mismatches.length}\n\n`;

fileBody += `${'='.repeat(72)}\n\n`;

if (mismatches.length === 0) {
    fileBody += '(none)\n';
} else {
    for (const m of mismatches) {
        fileBody += `[#${m.wi}] wardrobe1 v=${JSON.stringify(m.v)}\n${m.line}\n`;
        if (m.xlsmSameCatNo.length === 0) {
            fileBody += `  (xlsm not found)\n`;
        } else {
            if (m.xlsmSameCatNo.length > 1) {
                fileBody += `  (xlsm ${m.xlsmSameCatNo.length} rows)\n`;
            }
            for (const x of m.xlsmSameCatNo) {
                fileBody += `  xlsm id=${x.gameId} v=${JSON.stringify(x.v)}\n`;
                const cells = x.w.slice(0, 15).map((c) => escapeForWardrobeLine(c));
                fileBody += `  ['${cells.join("','")}'],\n`;
            }
        }
        fileBody += '\n';
    }
}

fs.writeFileSync(outputPath, fileBody.replace(/\r\n/g, '\n'));

console.log(`Using xlsm: ${xlsmFile}`);
if (fWhitelistFound) console.log(`F品白名单: ${nightIds.size} Ye / ${dayIds.size} Zhou id`);
console.log(`xlsm distinct v: ${vFromXlsm.size} | wardrobe1: ${wardrobe1.length} | mismatch: ${mismatches.length}`);
console.log(`\n=> ${outputPath}`);
