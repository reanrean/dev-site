/**
 * comp_wardrobe.js — maint.js「wardrobe」式对比，不做任何 unique key 对齐。
 *
 * 与 maint.js static_generate() 里 staticMode == 'wardrobe' 相同：
 *   从 xlsm clothes_data 按 make_wardrobe1 规则推出与 wardrobe1 一行同构的前 15 列，
 *   再对每一行算同一串 v：
 *     v = name + category + parseInt(编号) + 心级 + zeroIfBlank(华丽)…zeroIfBlank(保暖) + (tag 无 '+' 时才拼 tag)
 *
 * 把所有 xlsm 行得到的 v 放进 Set；对 wardrobe1 每一行算 v，若 v ∉ Set 则视为 mismatch
 * （官方可能改了名字/分类/编号/心级/属性/tag 等任意一项）。
 *
 * xlsm 多出来、wardrobe1 没有的 v 不输出。
 *
 * 名字：clothes_data B 列 + F品白名单 O/P 昼夜后缀（与 make_wardrobe1 一致，无 !/# 前缀）。
 *
 * mismatch 时按 wardrobe1 的「分类 + 编号」反查 xlsm（与 make_wardrobe1 同源推导），打印同编号的 clothes_data 行：
 *   xlsm id=… v="…" 以及合成的前 15 列（便于和 wardrobe1 逐项对比）。
 * make_wardrobe1.js 本身只有 id→行、getItemNo 正向；反查表仅在此脚本构建。
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

/** w 至少要有下标 0..14（与 wardrobe1 一行一致）；v 不用 15..19 */
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

const dirFiles = fs.readdirSync(scriptDir);
const xlsmFile = dirFiles.filter((f) => f.endsWith('.xlsm') && !f.startsWith('~$')).sort().reverse()[0];
if (!xlsmFile) {
    console.error('Error: No .xlsm file found in current directory.');
    process.exit(1);
}
const excelPath = path.join(scriptDir, xlsmFile);

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
 * 从 clothes_data 第 i 行构造与 wardrobe1 前 15 列同构的数组，用于 wardrobeSignature。
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

/** 分类\0编号 → xlsm 中所有匹配行（通常 1 条；hardcode/重复时可能多条） */
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

let fileBody = `// comp_wardrobe.js — vlookup: wardrobe1.v ∉ xlsm-derived v set\n`;
fileBody += `// xlsm: ${xlsmFile}\n`;
fileBody += `// F品白名单: ${fWhitelistFound ? `夜${nightIds.size} / 昼${dayIds.size} id` : '未找到'}\n`;
fileBody += `// v 定义同 maint.js static 「wardrobe」: name+cat+parseInt(编号)+心级+华丽…保暖+tag(无'+')\n`;
fileBody += `// xlsm 可解析行 v 种类: ${vFromXlsm.size} | clothes_data 跳过行: ${skippedXlsm}\n`;
fileBody += `// xlsm 重复 v 出现次数(行数-种类): ${duplicateVCount}\n`;
fileBody += `// wardrobe1 行数: ${wardrobe1.length}\n`;
fileBody += `// mismatch (v 不在 xlsm 集合中): ${mismatches.length}\n`;
fileBody += `// 反查索引: 分类+编号 → xlsm id（与 make_wardrobe1 推导一致，非游戏内其它 id 表）\n\n`;

fileBody += `${'='.repeat(72)}\n`;
fileBody += `wardrobe1 中 v 未在 xlsm 集合命中（可能官方改了任意属性）\n`;
fileBody += `${'='.repeat(72)}\n\n`;

if (mismatches.length === 0) {
    fileBody += '(none)\n';
} else {
    for (const m of mismatches) {
        fileBody += `[#${m.wi}] wardrobe1 v=${JSON.stringify(m.v)}\n${m.line}\n`;
        if (m.xlsmSameCatNo.length === 0) {
            fileBody += `  (xlsm 无 分类=${JSON.stringify(m.cat)} 编号=${JSON.stringify(m.itemNo)} 的 clothes_data 行；分类或编号可能已改)\n`;
        } else {
            if (m.xlsmSameCatNo.length > 1) {
                fileBody += `  (xlsm 同分类+编号 ${m.xlsmSameCatNo.length} 行)\n`;
            }
            for (const x of m.xlsmSameCatNo) {
                fileBody += `  xlsm id=${x.gameId} v=${JSON.stringify(x.v)}\n`;
                const cells = x.w.slice(0, 15).map((c) => escapeForWardrobeLine(c));
                fileBody += `  xlsm 前15列: ['${cells.join("','")}'],\n`;
            }
        }
        fileBody += '\n';
    }
}

fs.writeFileSync(outputPath, fileBody.replace(/\r\n/g, '\n'));

console.log(`Using xlsm: ${xlsmFile}`);
if (fWhitelistFound) console.log(`F品白名单: ${nightIds.size} 夜 / ${dayIds.size} 昼 id`);
console.log(`xlsm distinct v: ${vFromXlsm.size} | wardrobe1: ${wardrobe1.length} | mismatch: ${mismatches.length}`);
console.log(`\n=> ${outputPath}`);
