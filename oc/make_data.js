/**
 * make_data.js - Regenerate nikkis_choice/data files from lua sources
 * 
 * Generates:
 *   1. convert.js   (var convert)
 *   2. merchant.js   (shop section + var patternPrice)
 *   3. pattern.js    (var pattern_m2, var pattern_c, var pattern_e)
 *   4. setcategory.js (var setcategory)
 * 
 * Respects wardrobe: only outputs items that exist in wardrobe1.js
 *
 * Also writes output/make_data_source_checks.txt — wardrobe 来源/套装 suggestions
 * matching nikkis_choice/maint.js static_generate() console.log rules.
 */

const fs = require('fs');
const path = require('path');
const { loadIdOverrides } = require('./load_id_overrides');

// --- Paths ---
const scriptDir = __dirname;
const { uidRemap } = loadIdOverrides(scriptDir);
const nikkisDir = path.resolve(scriptDir, '../../nikkis_choice');
const dataDir = path.join(nikkisDir, 'data');

if (!fs.existsSync(nikkisDir)) {
    console.error('Error: ../../nikkis_choice does not exist. Exiting.');
    process.exit(1);
}

// --- Load wardrobe1.js to build clothesSet (name lookup by mainType+id) ---
const wardrobe1Path = path.join(dataDir, 'wardrobe1.js');
if (!fs.existsSync(wardrobe1Path)) {
    console.error('Error: wardrobe1.js not found. Exiting.');
    process.exit(1);
}

// Parse wardrobe1.js - extract the array
const w1Raw = fs.readFileSync(wardrobe1Path, 'utf8');
const w1Match = w1Raw.match(/var\s+wardrobe1\s*=\s*\[/);
if (!w1Match) { console.error('Cannot parse wardrobe1.js'); process.exit(1); }

// Use eval to load wardrobe1 (it's just a JS array)
let wardrobe1;
try {
    // Replace "var wardrobe1" so it doesn't conflict, then eval
    const startIdx = w1Match.index;
    const code = w1Raw.substring(startIdx).replace('var wardrobe1', 'wardrobe1');
    wardrobe1 = null;
    eval(code);
} catch (e) {
    console.error('Failed to eval wardrobe1.js:', e.message);
    process.exit(1);
}
console.log(`Loaded wardrobe1: ${wardrobe1.length} items`);

// Build clothesSet: { mainType: { id: name } }
// clothesSrc: { mainType: { id: full wardrobe1 row } } (same as maint.js clothesSrc)
// clothesRow: { mainType: { id: index in wardrobe1 } } (same as maint.js clothesRow / tar.row)
// Build setCates: unique set names from wardrobe
const clothesSet = {};
const clothesSrc = {};
const clothesRow = {};
const setCates = new Set();
for (let wi = 0; wi < wardrobe1.length; wi++) {
    const w = wardrobe1[wi];
    const t = w[1].split('-')[0]; // mainType without subtype
    if (!clothesSet[t]) clothesSet[t] = {};
    clothesSet[t][w[2]] = w[0]; // id -> name
    if (!clothesSrc[t]) clothesSrc[t] = {};
    clothesSrc[t][w[2]] = w;
    if (!clothesRow[t]) clothesRow[t] = {};
    clothesRow[t][w[2]] = wi;

    const suitName = w[16];
    if (suitName && !/·[染套基]$/.test(suitName)) {
        setCates.add(suitName);
    }
}
console.log(`clothesSet types: ${Object.keys(clothesSet).length}, setCates: ${setCates.size}`);

/** @type {{ section: string, line: string, wardrobeIndex: number }[]} */
const sourceCheckLogs = [];

function getSrcRow(tar) {
    if (!tar || !tar.mainType || !clothesSrc[tar.mainType]) return null;
    return clothesSrc[tar.mainType][tar.id] || null;
}

function wardrobeIndexFor(tar) {
    if (!tar || !tar.mainType || !clothesRow[tar.mainType]) return Number.MAX_SAFE_INTEGER;
    const idx = clothesRow[tar.mainType][tar.id];
    return idx !== undefined ? idx : Number.MAX_SAFE_INTEGER;
}

function cloneWardrobeRow(row) {
    return row.map((x) => x);
}

function formatWardrobeLogLine(row, prefix = '') {
    return prefix + "  ['" + row.join("','") + "'],";
}

function pushSourceCheck(section, line, wardrobeIndex) {
    sourceCheckLogs.push({ section, line, wardrobeIndex });
}

/** clothes={ ... } ID list inside an achievement_detail block */
function extractClothesIdsFromAchieveContent(content) {
    const marker = 'clothes=';
    const i = content.indexOf(marker);
    if (i < 0) return [];
    let depth = 0;
    let start = -1;
    for (let j = i + marker.length; j < content.length; j++) {
        const c = content[j];
        if (c === '{') {
            depth++;
            if (depth === 1) start = j + 1;
        } else if (c === '}') {
            depth--;
            if (depth === 0 && start >= 0) {
                const inner = content.substring(start, j);
                const ids = [];
                const re = /\[\d+\]\s*=\s*(\d+)/g;
                let m;
                while ((m = re.exec(inner)) !== null) ids.push(m[1]);
                return ids;
            }
        }
    }
    return [];
}

function writeSourceCheckReport() {
    const outputDir = path.join(scriptDir, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const order = [
        ['merge', 'merge — 来源应含 设·图 (pattern_m2)'],
        ['evolve', 'evolve — 来源应含 设·进* (pattern_e)'],
        ['cvtSeries', 'cvtSeries — 来源应含 设·定* (pattern_c)'],
        ['shop', 'shop — 来源应含 店·* (merchant shop)'],
        ['achieve', 'achieve — 套装应与成就套名一致'],
    ];
    let out = `// Generated by make_data.js\n`;
    out += `// Wardrobe checks (nikkis_choice/maint.js static_generate console.log)\n`;
    out += `// Within each section, lines are ordered by wardrobe1 array index (same as maint tar.row).\n\n`;
    let total = 0;
    for (const [key, title] of order) {
        const items = sourceCheckLogs.filter((x) => x.section === key);
        items.sort((a, b) => {
            if (a.wardrobeIndex !== b.wardrobeIndex) return a.wardrobeIndex - b.wardrobeIndex;
            return a.line.localeCompare(b.line);
        });
        if (items.length === 0) continue;
        total += items.length;
        out += `// === ${title} ===\n`;
        for (const it of items) out += it.line + '\n';
        out += '\n';
    }
    if (total === 0) out += '// (no suggested wardrobe line fixes)\n';
    const p = path.join(outputDir, 'make_data_source_checks.txt');
    fs.writeFileSync(p, out.replace(/\r\n/g, '\n'));
    console.log(`\n=== source checks ===\n${total} suggestion line(s) -> ${p}`);
}

// --- Lua directory ---
const dirFiles = fs.readdirSync(scriptDir);
const luaDirName = dirFiles.filter(f => {
    try { return fs.statSync(path.join(scriptDir, f)).isDirectory() && f.includes('lua'); }
    catch { return false; }
})[0];

if (!luaDirName) {
    console.error('Error: No lua directory found. Exiting.');
    process.exit(1);
}

const luaDir = path.join(scriptDir, luaDirName);
console.log('Lua dir:', luaDirName);

function luaFile(name) {
    const p = path.join(luaDir, name);
    return fs.existsSync(p) ? p : null;
}

// ============================================================
// Lua parsing utilities
// ============================================================

function parseLuaTable(raw, tableName) {
    const tableStart = raw.indexOf(tableName);
    if (tableStart === -1) return [];

    const entries = [];
    const entryRe = /\[(\d+)\]\s*=\s*\{/g;
    entryRe.lastIndex = tableStart;
    let em;
    while ((em = entryRe.exec(raw)) !== null) {
        const key = em[1];
        let depth = 0;
        let start = -1;
        for (let i = em.index + em[0].length - 1; i < raw.length; i++) {
            if (raw[i] === '{') { depth++; if (depth === 1) start = i + 1; }
            else if (raw[i] === '}') {
                depth--;
                if (depth === 0) {
                    entries.push({ name: key, content: raw.substring(start, i) });
                    entryRe.lastIndex = i + 1;
                    break;
                }
            }
        }
    }
    return entries;
}

function extractField(content, fieldName, keepChars) {
    let txt = keepChars ? content : content.replace(/[^0-9a-z\,_{}=]/gi, '');
    const prefix = fieldName + '=';
    if (txt.indexOf(prefix) < 0) return [];
    const parts = txt.split(prefix);
    const results = [];
    for (let i = 1; i < parts.length; i++) {
        results.push(parts[i].split(',')[0]);
    }
    return results;
}

// --- UID conversion ---
const mainType = ['发型', '连衣裙', '外套', '上装', '下装', '袜子', '鞋子', '饰品', '妆容', '萤光之灵'];

function convertType(tid) {
    switch (tid) {
        case '1': return '发型';
        case '2': return '连衣裙';
        case '3': return '外套';
        case '4': return '上装';
        case '5': return '下装';
        case '6': return '袜子';
        case '7': return '鞋子';
        case '8': return '饰品';
        case '9': return '妆容';
        case '18': return '饰品';
    }
    return '';
}

function uidToTypeId(uid) {
    uid = String(uid);
    const mapped = uidRemap[uid];
    if (mapped) uid = mapped;

    const s = uid;
    const mainId = s.substring(0, s.length - 4);
    const subId = s.substring(s.length - 4);
    const id = (mainId === '18') ? ('1' + subId) : (subId[0] === '0' ? subId.substring(1) : subId);
    const type = convertType(mainId);
    const name = (clothesSet[type] && clothesSet[type][id]) ? clothesSet[type][id] : null;
    return { mainType: type, id: id, uid: uid, name: name };
}

function convertDye(tid) {
    switch (tid) {
        case '2001': return ['石榴红', '8'];
        case '2002': return ['青柠黄', '8'];
        case '2003': return ['阳光橙', '8'];
        case '2004': return ['灵动绿', '8'];
        case '2005': return ['天真蓝', '8'];
        case '2006': return ['典雅紫', '8'];
        case '2007': return ['梦幻粉', '8'];
        case '2008': return ['珍珠白', '8'];
        case '2009': return ['星尘黑', '8'];
        case '2010': return ['其他染料', '12'];
        case '3001': return ['水玉点点', '20'];
        case '3002': return ['经典网格', '20'];
        case '3003': return ['清新条纹', '20'];
        case '3004': return ['高级花纹', '20'];
        case '2011': return ['回忆星辰', '16'];
    }
    return [tid, '?'];
}

function convertPriceType(tid) {
    switch (tid) {
        case '0': return '金币';
        case '1': return '钻石';
        case '3': return '水晶鞋';
        case '6': return '蔷薇';
        case '5': return '翡翠';
        case '9': return '沙漏';
        case '17': return '惊雀铃';
        case '28': return '琉璃';
        default: return '?';
    }
}

// ============================================================
// 1. convert.js - gdClothesConvertData
// ============================================================
function generateConvert() {
    const filePath = luaFile('clothes_convert_data.lua_de');
    if (!filePath) { console.log('SKIP: clothes_convert_data.lua_de not found'); return null; }

    const raw = fs.readFileSync(filePath, 'utf8');
    const entries = parseLuaTable(raw, 'gdClothesConvertData');
    console.log(`convert: ${entries.length} entries parsed`);

    const lines = [];
    for (const entry of entries) {
        const ids = extractField(entry.content, 'id');
        const items = extractField(entry.content, 'item');
        const nums = extractField(entry.content, 'num');

        if (ids.length === 0 || items.length === 0 || nums.length === 0) continue;

        const tar = uidToTypeId(ids[0]);
        if (!tar.name) continue; // NOT IN WARDROBE - skip

        const dye = convertDye(items[0]);
        const num = nums[0];

        lines.push(`  ['${tar.mainType}','${tar.id}','${dye[0]}','${dye[1]}','${num}'],`);
    }
    return lines;
}

// ============================================================
// 2.1 merchant.js - shop section from gdClothesShopData
// ============================================================
function generateShop() {
    const filePath = luaFile('clothes_shop_data.lua_de');
    if (!filePath) { console.log('SKIP: clothes_shop_data.lua_de not found'); return null; }

    const raw = fs.readFileSync(filePath, 'utf8');
    const entries = parseLuaTable(raw, 'gdClothesShopData');
    console.log(`shop: ${entries.length} entries parsed`);

    const skip = [11379, 30574, 40593, 50550, 71237, 83111, 83112, 83113, 83114, 10818, 30339, 40449, 50413, 60312, 70742, 81241, 81242, 81243, 90053, 11477, 71318];

    const lines = [];
    for (const entry of entries) {
        const ids = extractField(entry.content, 'id');
        if (ids.length === 0) continue;

        if (skip.includes(parseInt(ids[0]))) continue;

        const tar = uidToTypeId(ids[0]);
        if (!tar.name) continue; // NOT IN WARDROBE

        const price = extractField(entry.content, 'price')[0];
        const priceType = extractField(entry.content, 'price_type')[0];
        const currency = convertPriceType(priceType);
        const isActivityGoods = extractField(entry.content, 'is_activity_goods')[0];
        const isOld = isActivityGoods === '1' ? '1' : '0';

        const tarRow = getSrcRow(tar);
        if (tarRow) {
            const src15 = String(tarRow[15] || '');
            if (src15.indexOf('店·') < 0) {
                const ward = cloneWardrobeRow(tarRow);
                ward[15] = '店·' + currency;
                ward[18] = currency.charAt(0);
                pushSourceCheck('shop', formatWardrobeLogLine(ward), wardrobeIndexFor(tar));
            }
        }

        lines.push(`['${tar.mainType}','${tar.id}',${price},'${currency}',${isOld}],`);
    }
    return lines;
}

// ============================================================
// 2.2 merchant.js - patternPrice from gdArenaShopData (skip id < 10000)
// ============================================================
function generateArena() {
    const filePath = luaFile('arena_shop_data.lua_de');
    if (!filePath) { console.log('SKIP: arena_shop_data.lua_de not found'); return null; }

    const raw = fs.readFileSync(filePath, 'utf8');
    const entries = parseLuaTable(raw, 'gdArenaShopData');
    console.log(`arena: ${entries.length} entries parsed`);

    const lines = [];
    for (const entry of entries) {
        const uid = parseInt(entry.name);
        if (uid < 10000) continue;

        const tar = uidToTypeId(entry.name);
        if (!tar.name) continue; // NOT IN WARDROBE

        const price = extractField(entry.content, 'price')[0];
        const noDisplay = extractField(entry.content, 'no_display');
        const isOldProduct = extractField(entry.content, 'is_old_product')[0];
        const haveDiscount = isOldProduct === '1' ? '0' : '1';
        const isOld = extractField(entry.content, 'is_activity_goods')[0];

        if (noDisplay.length === 0) {
            lines.push(`  ['${tar.mainType}','${tar.id}',${price},${haveDiscount},${isOld},],`);
        }
    }
    return lines;
}

// ============================================================
// 3.1 pattern.js - pattern_m2 from gdClothesMergeData
// ============================================================
function generateMerge() {
    const filePath = luaFile('clothes_merge_data.lua_de');
    if (!filePath) { console.log('SKIP: clothes_merge_data.lua_de not found'); return null; }

    const raw = fs.readFileSync(filePath, 'utf8');
    const entries = parseLuaTable(raw, 'gdClothesMergeData');
    console.log(`merge: ${entries.length} entries parsed`);

    const skip = [21270, 30632, 60605, 83514, 83515, 90205];

    const lines = [];
    let skippedMissing = 0;
    for (const entry of entries) {
        const ids = extractField(entry.content, 'id');
        if (ids.length === 0) continue;
        const tarUid = parseInt(ids[0]);
        if (skip.includes(tarUid)) continue;

        const tar = uidToTypeId(ids[0]);
        if (!tar.name) { skippedMissing++; continue; } // NOT IN WARDROBE

        const tarRow = getSrcRow(tar);
        if (tarRow) {
            const src15 = String(tarRow[15] || '');
            if (src15.indexOf('设·图') < 0) {
                const ward = cloneWardrobeRow(tarRow);
                ward[15] = '设·图';
                ward[18] = '图';
                pushSourceCheck('merge', formatWardrobeLogLine(ward), wardrobeIndexFor(tar));
            }
        }

        const srcArr = extractField(entry.content, 'cloth');
        const numArr = extractField(entry.content, 'num');

        const tarIdx = mainType.indexOf(tar.mainType);
        for (let j = 0; j < srcArr.length; j++) {
            const src = uidToTypeId(srcArr[j]);
            if (tar.name && src.name) {
                lines.push(`[${tarIdx},${parseInt(tar.id)},${mainType.indexOf(src.mainType)},${parseInt(src.id)},${numArr[j]}],`);
            }
        }
    }
    if (skippedMissing) console.log(`  merge: skipped ${skippedMissing} items not in wardrobe`);
    return lines;
}

// ============================================================
// 3.2 pattern.js - pattern_c from gdClothesCvtSeriesData
// ============================================================
function generateCvtSeries() {
    const filePath = luaFile('clothes_data.lua_de');
    if (!filePath) { console.log('SKIP: clothes_data.lua_de not found'); return null; }

    const raw = fs.readFileSync(filePath, 'utf8');
    const entries = parseLuaTable(raw, 'gdClothesCvtSeriesData');
    console.log(`cvtSeries: ${entries.length} entries parsed`);

    const lines = [];
    let skippedMissing = 0;
    for (const entry of entries) {
        const ids = [];
        const re = /\[\d+\]\s*=\s*(\d+)/g;
        let m;
        while ((m = re.exec(entry.content)) !== null) {
            ids.push(m[1]);
        }

        if (ids.length < 2) continue;

        const src = uidToTypeId(ids[0]);
        if (!src.name) { skippedMissing++; continue; }

        const srcIdx = mainType.indexOf(src.mainType);
        for (let j = 1; j < ids.length; j++) {
            const tar = uidToTypeId(ids[j]);
            if (tar.name && src.name) {
                const tarRow = getSrcRow(tar);
                if (tarRow) {
                    const src15 = String(tarRow[15] || '');
                    if (src15.indexOf('设·定') < 0) {
                        const ward = cloneWardrobeRow(tarRow);
                        ward[15] = '设·定' + src.id;
                        ward[18] = '定·';
                        pushSourceCheck('cvtSeries', formatWardrobeLogLine(ward), wardrobeIndexFor(tar));
                    }
                }
                lines.push(`[${mainType.indexOf(tar.mainType)},${parseInt(tar.id)},${srcIdx},${parseInt(src.id)},1],`);
            }
        }
    }
    if (skippedMissing) console.log(`  cvtSeries: skipped ${skippedMissing} items not in wardrobe`);
    return lines;
}

// ============================================================
// 3.3 pattern.js - pattern_e from gdClothesEvolutionData
// ============================================================
function generateEvolve() {
    const filePath = luaFile('clothes_evolution_data.lua_de');
    if (!filePath) { console.log('SKIP: clothes_evolution_data.lua_de not found'); return null; }

    const raw = fs.readFileSync(filePath, 'utf8');
    const entries = parseLuaTable(raw, 'gdClothesEvolutionData');
    console.log(`evolve: ${entries.length} entries parsed`);

    const lines = [];
    let skippedMissing = 0;
    for (const entry of entries) {
        const ids = extractField(entry.content, 'id');
        const srcs = extractField(entry.content, 'src');
        const nums = extractField(entry.content, 'num');

        if (ids.length === 0 || srcs.length === 0 || nums.length === 0) continue;

        const tar = uidToTypeId(ids[0]);
        const src = uidToTypeId(srcs[0]);

        if (tar.name && src.name) {
            const tarRow = getSrcRow(tar);
            if (tarRow) {
                const src15 = String(tarRow[15] || '');
                if (src15.indexOf('设·进') < 0) {
                    const ward = cloneWardrobeRow(tarRow);
                    ward[15] = '设·进' + src.id;
                    ward[18] = '进·';
                    pushSourceCheck('evolve', formatWardrobeLogLine(ward), wardrobeIndexFor(tar));
                }
            }
            lines.push(`[${mainType.indexOf(tar.mainType)},${parseInt(tar.id)},${mainType.indexOf(src.mainType)},${parseInt(src.id)},${nums[0]}],`);
        } else {
            skippedMissing++;
        }
    }
    if (skippedMissing) console.log(`  evolve: skipped ${skippedMissing} items not in wardrobe`);
    return lines;
}

// ============================================================
// 4. setcategory.js - gdAchievementDetailData
// ============================================================
function generateAchieve() {
    const filePath = luaFile('achievement_detail_data.lua_de');
    if (!filePath) { console.log('SKIP: achievement_detail_data.lua_de not found'); return null; }

    const raw = fs.readFileSync(filePath, 'utf8');
    const entries = parseLuaTable(raw, 'gdAchievementDetailData');
    console.log(`achieve: ${entries.length} entries parsed`);

    const genreMap = {
        '7': ['节日盛典', 10],
        '8': ['十二月剧团', 11],
        '9': ['一路相随', 12],
        '10': ['满天繁星', 13],
        '11': ['苹果联邦', 3],
        '12': ['莉莉斯王国', 4],
        '13': ['云端帝国', 5],
        '14': ['信鸽王国', 6],
        '15': ['北地王国', 7],
        '16': ['荒原共和国', 8],
        '17': ['废墟孤岛', 9],
        '18': ['梦恋奇迹', 14],
        '19': ['故事套装', 30],
        '22': ['远古化石展', 18],
        '23': ['星座展', 19],
        '24': ['御苑琼芳', 15],
        '25': ['吴郡风雅', 16],
        '27': ['至臻典藏', 1],
        '28': ['璀璨华光', 2],
        '29': ['童话梦乡', 20],
        '30': ['缤纷画卷', 21],
        '32': ['越韵绮缘', 17],
    };

    const specialNightSuits = ['白骨夫人', '幽冥仙主', '恒耀神冕'];

    const outArr = {};
    let skippedNotInWardrobe = 0;

    for (const entry of entries) {
        const nameArr = extractField(entry.content, 'name', true);
        if (nameArr.length === 0) continue;
        const name = nameArr[0].replace(/[\ \"]/g, '');

        const genreArr = extractField(entry.content, 'genre');
        if (genreArr.length === 0) continue;
        const genre = genreArr[0];

        const mapping = genreMap[genre];
        if (!mapping) continue;
        const [genreName, seq] = mapping;

        if (!name) continue;

        // Same as maint.js: clothes= suit check runs for every entry, not only setCates hits
        const clothIds = extractClothesIdsFromAchieveContent(entry.content);
        for (const uidStr of clothIds) {
            const tar = uidToTypeId(uidStr);
            if (!tar.name) continue;
            const tarRow = getSrcRow(tar);
            if (!tarRow) continue;
            const suitCol = tarRow[16] || '';
            if (suitCol !== name) {
                const ward = cloneWardrobeRow(tarRow);
                ward[16] = name;
                const pref = !suitCol ? '' : '//';
                pushSourceCheck('achieve', formatWardrobeLogLine(ward, pref), wardrobeIndexFor(tar));
            }
        }

        // Filter: only include if suit name exists in wardrobe's setCates
        if (!setCates.has(name)) { skippedNotInWardrobe++; continue; }

        if (!outArr[seq]) outArr[seq] = [];
        outArr[seq].push(`  ['${genreName}','${name}'],`);

        if (specialNightSuits.includes(name)) {
            outArr[seq].push(`  ['${genreName}','${name}·入夜'],`);
        }
    }

    if (skippedNotInWardrobe) console.log(`  achieve: skipped ${skippedNotInWardrobe} suits not in wardrobe`);

    // Reverse within each group and output in seq order
    const lines = [];
    const seqs = Object.keys(outArr).map(Number).sort((a, b) => a - b);
    for (const seq of seqs) {
        const group = outArr[seq];
        group.reverse();
        for (const line of group) {
            lines.push(line);
        }
    }
    return lines;
}

// ============================================================
// Write files
// ============================================================

// 1. convert.js
console.log('\n=== convert.js ===');
const convertLines = generateConvert();
if (convertLines) {
    const convertPath = path.join(dataDir, 'convert.js');
    const convertContent = fs.readFileSync(convertPath, 'utf8');

    // Find "var convert = [" and its matching "];"
    const convertStart = convertContent.indexOf('var convert = [');
    const convertEnd = findArrayEnd(convertContent, convertStart);

    const newConvert = 'var convert = [\n' + convertLines.join('\n') + '\n];';
    const newConvertContent = convertContent.substring(0, convertStart) + newConvert + convertContent.substring(convertEnd);

    fs.writeFileSync(convertPath, newConvertContent);
    console.log(`Written ${convertLines.length} entries to convert.js`);
}

// 2. merchant.js - first restore from git or backup? No, we work with current.
// But the current file may be broken from the previous run. Let's use a safer approach.
console.log('\n=== merchant.js ===');
const merchantPath = path.join(dataDir, 'merchant.js');
let merchantContent = fs.readFileSync(merchantPath, 'utf8');

// 2.1 Shop section - replace between //start: shop and //end: shop (exclusive of markers)
const shopLines = generateShop();
if (shopLines) {
    const shopStartMarker = '//start: shop';
    const shopEndMarker = '//end: shop';
    const shopStartIdx = merchantContent.indexOf(shopStartMarker);
    const shopEndIdx = merchantContent.indexOf(shopEndMarker);

    if (shopStartIdx >= 0 && shopEndIdx >= 0) {
        // Keep everything up to and including "//start: shop\n", then new content, then "//end: shop" onwards
        const afterStart = merchantContent.indexOf('\n', shopStartIdx) + 1;
        merchantContent = merchantContent.substring(0, afterStart) +
            shopLines.join('\n') + '\n' +
            merchantContent.substring(shopEndIdx);
        console.log(`Shop: ${shopLines.length} entries`);
    } else {
        console.log('WARNING: Could not find //start: shop or //end: shop markers');
    }
}

// 2.2 patternPrice - replace var patternPrice=[...];
const arenaLines = generateArena();
if (arenaLines) {
    const ppStart = merchantContent.indexOf('var patternPrice=');
    if (ppStart < 0) {
        // Try with spaces
        const ppStart2 = merchantContent.indexOf('var patternPrice=[');
        if (ppStart2 >= 0) {
            // ok
        }
    }

    const ppIdx = merchantContent.indexOf('var patternPrice=');
    if (ppIdx >= 0) {
        const ppEnd = findArrayEnd(merchantContent, ppIdx);
        const newPP = 'var patternPrice=[\n//mainType, id, price, haveDiscount, isOld, version\n' + arenaLines.join('\n') + '\n];';
        merchantContent = merchantContent.substring(0, ppIdx) + newPP + merchantContent.substring(ppEnd);
        console.log(`Arena/patternPrice: ${arenaLines.length} entries`);
    } else {
        console.log('WARNING: Could not find var patternPrice');
    }
}

fs.writeFileSync(merchantPath, merchantContent);

// 3. pattern.js
console.log('\n=== pattern.js ===');
const patternPath = path.join(dataDir, 'pattern.js');
let patternContent = fs.readFileSync(patternPath, 'utf8');

// 3.1 pattern_m2
const mergeLines = generateMerge();
if (mergeLines) {
    const m2Start = patternContent.indexOf('var pattern_m2 = [');
    if (m2Start >= 0) {
        const m2End = findArrayEnd(patternContent, m2Start);
        patternContent = patternContent.substring(0, m2Start) +
            'var pattern_m2 = [\n' + mergeLines.join('\n') + '\n];' +
            patternContent.substring(m2End);
        console.log(`pattern_m2: ${mergeLines.length} entries`);
    }
}

// 3.2 pattern_c
const cvtLines = generateCvtSeries();
if (cvtLines) {
    const cStart = patternContent.indexOf('var pattern_c = [');
    if (cStart >= 0) {
        const cEnd = findArrayEnd(patternContent, cStart);
        patternContent = patternContent.substring(0, cStart) +
            'var pattern_c = [\n' + cvtLines.join('\n') + '\n];' +
            patternContent.substring(cEnd);
        console.log(`pattern_c: ${cvtLines.length} entries`);
    }
}

// 3.3 pattern_e
const evolveLines = generateEvolve();
if (evolveLines) {
    const eStart = patternContent.indexOf('var pattern_e = [');
    if (eStart >= 0) {
        const eEnd = findArrayEnd(patternContent, eStart);
        patternContent = patternContent.substring(0, eStart) +
            'var pattern_e = [\n' + evolveLines.join('\n') + '\n];' +
            patternContent.substring(eEnd);
        console.log(`pattern_e: ${evolveLines.length} entries`);
    }
}

fs.writeFileSync(patternPath, patternContent);

// 4. setcategory.js
console.log('\n=== setcategory.js ===');
const achieveLines = generateAchieve();
if (achieveLines) {
    const scPath = path.join(dataDir, 'setcategory.js');
    const newSC = 'var setcategory = [\n' + achieveLines.join('\n') + '\n];\n';
    fs.writeFileSync(scPath, newSC);
    console.log(`setcategory: ${achieveLines.length} entries`);
}

writeSourceCheckReport();

console.log('\nDone!');

// ============================================================
// Helpers
// ============================================================
function findArrayEnd(content, varStart) {
    let depth = 0;
    let started = false;
    for (let i = varStart; i < content.length; i++) {
        if (content[i] === '[') { depth++; started = true; }
        else if (content[i] === ']') {
            depth--;
            if (started && depth === 0) {
                // Check for ; after ]
                let end = i + 1;
                if (end < content.length && content[end] === ';') end++;
                return end;
            }
        }
    }
    return content.length;
}
