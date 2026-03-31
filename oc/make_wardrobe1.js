const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// --- AUTO-DETECT .xlsm IN SCRIPT DIRECTORY ---
const cwd = __dirname;
const dirFiles = fs.readdirSync(cwd);
const xlsmFile = dirFiles.filter(f => f.endsWith('.xlsm') && !f.startsWith('~$')).sort().reverse()[0];
if (!xlsmFile) { console.error('Error: No .xlsm file found in current directory.'); process.exit(1); }
const excelPath = path.join(cwd, xlsmFile);

// --- Lua data files (all optional - skip if missing) ---
const luaDir = dirFiles.filter(f => { try { return fs.statSync(path.join(cwd, f)).isDirectory() && f.includes('lua'); } catch { return false; } })[0];
function luaPath(filename) {
    if (!luaDir) return null;
    const p = path.join(cwd, luaDir, filename);
    return fs.existsSync(p) ? p : null;
}

// --- CSV input / Output ---
const csvPath = path.join(cwd, 'input', '1280.csv');
if (!fs.existsSync(csvPath)) { console.error('Error: input/1280.csv not found.'); process.exit(1); }
const outputPath = path.join(cwd, 'output', 'wardrobe1_lines.txt');

// --- Game ID -> nikkis_choice item number ---
function getItemNo(id) {
    const s = String(id);
    if (s.substring(0, 2) === '18' && id > 100000) return '1' + s.substring(s.length - 4);
    const last4 = s.substring(s.length - 4);
    return last4[0] === '0' ? last4.substring(1) : last4;
}
const hardcodeNo = { 30961: '9961', 81327: '9327', 83221: '9221' };

// --- Task ID -> level display string ---
// e.g. 2116032 -> "III-11-支3公", 30121 -> "3-12少"
function taskIdToLevel(taskId) {
    const diff = taskId % 10; // 1=少女, 2=公主
    const rest = Math.floor(taskId / 10);
    const levelCode = rest % 1000;
    const chapter = Math.floor(rest / 1000);
    const vol = Math.floor(chapter / 100);
    const chNum = chapter % 100;
    const volPrefix = vol === 0 ? '' : (vol === 1 ? 'II-' : 'III-');
    const levelStr = levelCode >= 600 ? '支' + (levelCode - 600) : String(levelCode);
    const diffStr = diff === 1 ? '少' : '公';
    return volPrefix + chNum + '-' + levelStr + diffStr;
}

// --- Utility: extract balanced brace content starting from pos ---
function extractBraced(str, startPos) {
    const openIdx = str.indexOf('{', startPos);
    if (openIdx === -1) return null;
    let depth = 0;
    for (let i = openIdx; i < str.length; i++) {
        if (str[i] === '{') depth++;
        else if (str[i] === '}') { depth--; if (depth === 0) return { content: str.substring(openIdx + 1, i), end: i }; }
    }
    return null;
}

// --- MAIN ---
console.log("Using xlsm:", xlsmFile);
const wb = xlsx.readFile(excelPath);

// === Build maps from 参数表 ===
const ps = wb.Sheets['参数表'];

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

console.log(`参数表: ${Object.keys(depthTypeMap).length} depth_types, ${Object.keys(tagMap).length} tags`);

// === Lua parsers ===

function parseLuaSuits(filePath) {
    const suitMap = {};
    if (!filePath) return suitMap;
    const raw = fs.readFileSync(filePath, 'utf8');
    const tableStart = raw.indexOf('gdAchievementDetailData');
    if (tableStart === -1) return suitMap;
    const entryRe = /\[\d+\]\s*=\s*\{/g;
    entryRe.lastIndex = tableStart;
    let em;
    while ((em = entryRe.exec(raw)) !== null) {
        const result = extractBraced(raw, em.index);
        if (!result) break;
        const block = result.content;
        const typeMatches = [...block.matchAll(/(?<![a-zA-Z_])type\s*=\s*(\d+)/g)];
        const topType = typeMatches.length > 0 ? typeMatches[typeMatches.length - 1][1] : null;
        if (topType !== '1') { entryRe.lastIndex = result.end + 1; continue; }
        if (!block.includes('clothes=')) { entryRe.lastIndex = result.end + 1; continue; }
        const idMatch = block.match(/(?<![a-zA-Z_])id\s*=\s*(\d+)/);
        const nameMatch = block.match(/name\s*=\s*"([^"]+)"/);
        if (!nameMatch) { entryRe.lastIndex = result.end + 1; continue; }
        const clothes = [];
        const cBraced = extractBraced(block, block.indexOf('clothes='));
        if (cBraced) { let pm; const pr = /\[\d+\]\s*=\s*(\d+)/g; while ((pm = pr.exec(cBraced.content)) !== null) clothes.push(parseInt(pm[1])); }
        const rewardClothes = [];
        const rcIdx = block.indexOf('rewardcomplex=');
        if (rcIdx !== -1) {
            const rcBraced = extractBraced(block, rcIdx);
            if (rcBraced) { const ir = /id\s*=\s*(\d+)\s*,\s*num\s*=\s*\d+\s*,\s*type\s*=\s*0/g; let rm; while ((rm = ir.exec(rcBraced.content)) !== null) { const rid = parseInt(rm[1]); if (rid > 0) rewardClothes.push(rid); } }
        }
        if (clothes.length > 0) suitMap[nameMatch[1]] = { id: idMatch ? parseInt(idMatch[1]) : 0, clothes, rewardClothes };
        entryRe.lastIndex = result.end + 1;
    }
    return suitMap;
}

function parseCvtSeries(filePath) {
    const dyeToBase = {}, baseToDyes = {};
    if (!filePath) return { dyeToBase, baseToDyes };
    const raw = fs.readFileSync(filePath, 'utf8');
    const tableStart = raw.indexOf('gdClothesCvtSeriesData');
    if (tableStart === -1) return { dyeToBase, baseToDyes };
    const entryRe = /\[(\d+)\]\s*=\s*\{/g;
    entryRe.lastIndex = tableStart;
    let em;
    while ((em = entryRe.exec(raw)) !== null) {
        const result = extractBraced(raw, em.index);
        if (!result) break;
        const ids = []; let pm; const pr = /\[\d+\]\s*=\s*(\d+)/g;
        while ((pm = pr.exec(result.content)) !== null) ids.push(parseInt(pm[1]));
        if (ids.length > 1) { const base = ids[0]; const dyes = ids.slice(1); baseToDyes[base] = dyes; for (const d of dyes) dyeToBase[d] = base; }
        entryRe.lastIndex = result.end + 1;
    }
    return { dyeToBase, baseToDyes };
}

function parseSuitConvert(filePath) {
    const suitDyes = {};
    if (!filePath) return suitDyes;
    const raw = fs.readFileSync(filePath, 'utf8');
    const tableStart = raw.indexOf('gdSuitConvertData');
    if (tableStart === -1) return suitDyes;
    const entryRe = /\[(\d+)\]\s*=\s*\{/g;
    entryRe.lastIndex = tableStart;
    let em;
    while ((em = entryRe.exec(raw)) !== null) {
        const suitId = parseInt(em[1]);
        const result = extractBraced(raw, em.index);
        if (!result) break;
        const variants = [];
        const varRe = /\[\d+\]\s*=\s*\{/g; let vm;
        while ((vm = varRe.exec(result.content)) !== null) {
            const vr = extractBraced(result.content, vm.index);
            if (!vr) break;
            const ci = vr.content.indexOf('clothes=');
            if (ci !== -1) { const cb = extractBraced(vr.content, ci); if (cb) { const ids = []; let pm; const pr = /\[\d+\]\s*=\s*(\d+)/g; while ((pm = pr.exec(cb.content)) !== null) ids.push(parseInt(pm[1])); if (ids.length) variants.push(ids); } }
            varRe.lastIndex = vr.end + 1;
        }
        if (variants.length) suitDyes[suitId] = variants;
        entryRe.lastIndex = result.end + 1;
    }
    return suitDyes;
}

function parseAmputation(filePath) {
    const s = new Set();
    if (!filePath) return s;
    const raw = fs.readFileSync(filePath, 'utf8');
    const tableStart = raw.indexOf('gdClothesAmputationData');
    if (tableStart === -1) return s;
    const re = /\[(\d+)\]\s*=\s*\{/g; re.lastIndex = tableStart; let m;
    while ((m = re.exec(raw)) !== null) s.add(parseInt(m[1]));
    return s;
}

// === Parse gdClothesEvolutionData (进化 chains) ===
// Returns: evoMap: itemId -> srcId (this item evolves FROM srcId)
function parseEvolution(filePath) {
    const evoMap = {}; // id -> src (this evolves from src)
    if (!filePath) return evoMap;
    const raw = fs.readFileSync(filePath, 'utf8');
    const tableStart = raw.indexOf('gdClothesEvolutionData');
    if (tableStart === -1) return evoMap;
    const re = /\[(\d+)\]\s*=\s*\{[^}]*?id\s*=\s*\d+\s*,\s*num\s*=\s*\d+\s*,\s*src\s*=\s*(\d+)/g;
    re.lastIndex = tableStart;
    let m;
    while ((m = re.exec(raw)) !== null) evoMap[parseInt(m[1])] = parseInt(m[2]);
    return evoMap;
}

// === Parse gdTaskDetailClothesData (item -> task drops) ===
// Returns: clothesId -> [taskId, ...]
function parseTaskDrops(filePath) {
    const dropMap = {};
    if (!filePath) return dropMap;
    const raw = fs.readFileSync(filePath, 'utf8');
    const tableStart = raw.indexOf('gdTaskDetailClothesData');
    if (tableStart === -1) return dropMap;
    const entryRe = /\[(\d+)\]\s*=\s*\{/g;
    entryRe.lastIndex = tableStart;
    let em;
    while ((em = entryRe.exec(raw)) !== null) {
        const clothId = parseInt(em[1]);
        const result = extractBraced(raw, em.index);
        if (!result) break;
        const ids = []; let pm; const pr = /\[\d+\]\s*=\s*(\d+)/g;
        while ((pm = pr.exec(result.content)) !== null) ids.push(parseInt(pm[1]));
        if (ids.length) dropMap[clothId] = ids;
        entryRe.lastIndex = result.end + 1;
    }
    return dropMap;
}

// === Load all lua data ===
console.log("Parsing lua data...");
const suitMap = parseLuaSuits(luaPath('achievement_detail_data.lua_de'));
const { dyeToBase, baseToDyes } = parseCvtSeries(luaPath('clothes_data.lua_de'));
const suitDyes = parseSuitConvert(luaPath('suit_convert_data.lua_de'));
const amputationSet = parseAmputation(luaPath('clothes_amputation_data.lua_de'));
const evoMap = parseEvolution(luaPath('clothes_evolution_data.lua_de'));
const taskDropMap = parseTaskDrops(luaPath('task_detail_clothes_data.lua_de'));
console.log(`Suits: ${Object.keys(suitMap).length}, CvtSeries: ${Object.keys(baseToDyes).length}, SuitConvert: ${Object.keys(suitDyes).length}, 义肢: ${amputationSet.size}, Evo: ${Object.keys(evoMap).length}, TaskDrops: ${Object.keys(taskDropMap).length}`);

// === Grade conversion ===
function valueToGrade(rawValue, divisor) {
    if (!rawValue || rawValue === 0) return '';
    const scaled = Math.round(rawValue / divisor - 0.001);
    if (scaled <= 0) return '';
    if (gradeTable[scaled]) return gradeTable[scaled];
    const maxKey = Math.max(...Object.keys(gradeTable).map(Number));
    if (scaled > maxKey) return gradeTable[maxKey] || 'SSS';
    return '';
}

function getWardrobe1Category(cat, depthType) {
    const subType = depthTypeToSubtype[depthType];
    if (cat === '袜子') return subType === '袜套' ? '袜子-袜套' : '袜子-袜子';
    if (cat === '饰品' && subType) return '饰品-' + subType.replace(/\*/g, '·');
    return cat;
}

// === Read clothes_data from xlsm ===
const clothesData = xlsx.utils.sheet_to_json(wb.Sheets['clothes_data'], { header: 1 });
console.log(`clothes_data: ${clothesData.length - 1} items`);

const nameMap = {}, idMap = {};
for (let i = 1; i < clothesData.length; i++) {
    const name = clothesData[i][1], id = clothesData[i][0];
    if (name) { if (!nameMap[name]) nameMap[name] = []; nameMap[name].push(i); }
    if (id) idMap[id] = i;
}

// === Evolution helpers ===

// Trace evolution chain backwards: given an item, return [base, ..., item] (base first)
function getEvoChain(itemId) {
    const chain = [itemId];
    let cur = itemId;
    const visited = new Set([cur]);
    while (evoMap[cur]) {
        cur = evoMap[cur];
        if (visited.has(cur)) break; // prevent infinite loops
        visited.add(cur);
        chain.unshift(cur); // prepend: base goes first
    }
    return chain; // [base, 华丽, 珍稀, ...]
}

// For abbrev "公" or "少", resolve the actual task drop source for an item
function resolveTaskDrop(itemId, abbrev) {
    if (abbrev !== '公' && abbrev !== '少') return null;
    const tasks = taskDropMap[itemId];
    if (!tasks || tasks.length === 0) return null;
    // Filter by difficulty: 公=2, 少=1
    const targetDiff = abbrev === '公' ? 2 : 1;
    // Collect all matching tasks, pick the one that matches difficulty
    const levels = [];
    for (const tid of tasks) {
        if (tid % 10 === targetDiff) levels.push(taskIdToLevel(tid));
    }
    if (levels.length === 0) {
        // Fallback: just use first task
        return taskIdToLevel(tasks[0]);
    }
    // Join multiple drops with /
    return levels.join('/');
}

// === Generate wardrobe1 line ===
function generateLine(idx, source, abbrev, suitName) {
    const row = clothesData[idx];
    const id = row[0];
    const depthType = row[4];
    const rare = row[13];
    const special1 = row[15], special2 = row[16];
    const rawAttrs = [
        row[21] || 0, row[22] || 0, row[23] || 0, row[24] || 0,
        row[25] || 0, row[26] || 0, row[27] || 0, row[28] || 0,
        row[30] || 0, row[29] || 0, // 保暖, 清凉 (swapped)
    ];
    const cat = depthTypeMap[depthType];
    if (!cat) return { error: `Unknown depth_type ${depthType} for id ${id}` };
    const displayCat = getWardrobe1Category(cat, depthType);
    const itemNo = hardcodeNo[id] || getItemNo(id);
    const divisor = divisorMap[cat];
    if (!divisor) return { error: `No divisor for "${cat}" id ${id}` };
    const grades = rawAttrs.map(v => valueToGrade(v, divisor));
    const tag1Name = special1 ? (tagMap[special1] || '') : '';
    const tag2Name = special2 ? (tagMap[special2] || '') : '';
    const tagStr = [tag1Name, tag2Name].filter(Boolean).join('/');
    const yizhi = amputationSet.has(id) ? '1' : '';
    const line = `  ['${row[1]}','${displayCat}','${itemNo}','${rare}','${grades[0]}','${grades[1]}','${grades[2]}','${grades[3]}','${grades[4]}','${grades[5]}','${grades[6]}','${grades[7]}','${grades[8]}','${grades[9]}','${tagStr}','${source}','${suitName || ''}','V12.8.0','${abbrev}','${yizhi}'],`;
    return { id, line, itemNo };
}

// === Process a single item with evolution expansion ===
// If the item has an evo chain, emit all items in the chain (base first).
// base gets the original source (resolved to task drop if 公/少), others get 设·进<prevItemNo>
// suitName: base+intermediate get suitName·基, top (the original item) gets suitName
function emitWithEvolution(itemId, source, abbrev, suitName, results, errors) {
    const chain = getEvoChain(itemId);

    if (chain.length === 1) {
        // No evolution - just emit normally, but resolve task drops if needed
        const idx = idMap[itemId];
        if (!idx) { errors.push(`Item ID ${itemId} not found`); return; }
        let finalSource = source;
        if (abbrev === '公' || abbrev === '少') {
            const drop = resolveTaskDrop(itemId, abbrev);
            if (drop) finalSource = drop;
        }
        const r = generateLine(idx, finalSource, abbrev, suitName);
        if (r.error) { errors.push(r.error); return; }
        results.push(r);
        return;
    }

    // Evolution chain: chain[0]=base, chain[last]=top (the one in suit)
    // Emit from base to top
    for (let ci = 0; ci < chain.length; ci++) {
        const cid = chain[ci];
        const idx = idMap[cid];
        if (!idx) { errors.push(`Evo chain item ${cid} not found`); continue; }
        const isBase = (ci === 0);
        const isTop = (ci === chain.length - 1);

        let itemSource, itemAbbrev, itemSuit;

        if (isTop) {
            // Top item: use suitName as-is (e.g. "稚梦咩咩")
            itemSuit = suitName;
        } else {
            // Base and intermediate: suitName·基
            itemSuit = suitName ? `${suitName}·基` : '';
        }

        if (isBase) {
            // Base item: use original source, resolve task drops if 公/少
            itemSource = source;
            itemAbbrev = abbrev;
            if (abbrev === '公' || abbrev === '少') {
                const drop = resolveTaskDrop(cid, abbrev);
                if (drop) itemSource = drop;
            }
        } else {
            // Evolved item: source = 设·进<prevItemNo>
            const prevId = chain[ci - 1];
            const prevItemNo = hardcodeNo[prevId] || getItemNo(prevId);
            itemSource = `设·进${prevItemNo}`;
            itemAbbrev = `进·${abbrev}`;
        }

        const r = generateLine(idx, itemSource, itemAbbrev, itemSuit);
        if (r.error) { errors.push(r.error); continue; }
        results.push(r);
    }
}

// === Read CSV & process ===
const csvContent = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const csvLines = csvContent.trim().split('\n');
console.log(`CSV: ${csvLines.length} lines`);

const results = [], errors = [], warnings = [];

for (const line of csvLines) {
    const parts = line.trim().split(',');
    if (parts.length < 3) { errors.push(`Skipping invalid line: ${line}`); continue; }
    const isSuit = parts[0].trim() === '1';
    const itemName = parts[1].trim();
    const source = parts[2].trim();
    const abbrev = parts[3] ? parts[3].trim() : '';
    if (!itemName) continue;

    if (!isSuit) {
        // === Loose item (散件) ===
        const indices = nameMap[itemName];
        if (!indices || indices.length === 0) { errors.push(`NOT FOUND: "${itemName}"`); continue; }
        for (const idx of indices) {
            const id = clothesData[idx][0];
            emitWithEvolution(id, source, abbrev, '', results, errors);
        }
    } else {
        // === Suit (套装) ===
        const suit = suitMap[itemName];
        if (!suit) { errors.push(`SUIT NOT FOUND in lua: "${itemName}"`); continue; }

        const allBaseClothes = new Set(suit.clothes);
        const allRewardClothes = new Set(suit.rewardClothes);

        // --- 1. Base suit clothes (with evolution expansion) ---
        for (const clothId of suit.clothes) {
            emitWithEvolution(clothId, source, abbrev, itemName, results, errors);
        }

        // --- 2. Reward clothes (with evolution expansion) ---
        for (const rewardId of suit.rewardClothes) {
            emitWithEvolution(rewardId, `套装·${itemName}`, `套·${abbrev}`, `${itemName}·套`, results, errors);
        }

        // --- 3. Dye variants ---
        const dyeItemIds = new Set();
        const dyeBaseMap = {};
        // Collect dyes for base clothes + reward clothes + their evo chains
        const allDirectItems = new Set([...allBaseClothes, ...allRewardClothes]);
        // Also include evo chain items for dye lookup
        for (const cid of [...allBaseClothes, ...allRewardClothes]) {
            const chain = getEvoChain(cid);
            for (const ecid of chain) allDirectItems.add(ecid);
        }
        for (const baseClothId of allDirectItems) {
            const dyes = baseToDyes[baseClothId];
            if (!dyes) continue;
            const baseItemNo = hardcodeNo[baseClothId] || getItemNo(baseClothId);
            for (const dyeId of dyes) {
                dyeItemIds.add(dyeId);
                dyeBaseMap[dyeId] = { baseId: baseClothId, baseItemNo };
            }
        }

        for (const dyeId of dyeItemIds) {
            const idx = idMap[dyeId];
            if (!idx) { errors.push(`Dye ID ${dyeId} not found (suit: ${itemName})`); continue; }
            const base = dyeBaseMap[dyeId];
            const r = generateLine(idx, `设·定${base.baseItemNo}`, `定·${abbrev}`, `${itemName}·染`);
            if (r.error) { errors.push(r.error); continue; }
            results.push(r);
        }

        // --- 4. Check suit_convert for extras ---
        const suitConvertClothes = new Set();
        const suitDyeVariants = suitDyes[suit.id];
        if (suitDyeVariants) { for (const v of suitDyeVariants) for (const cid of v) suitConvertClothes.add(cid); }

        const allKnown = new Set([...allDirectItems, ...allRewardClothes, ...dyeItemIds]);
        const extraFromConvert = [];
        for (const cid of suitConvertClothes) { if (!allKnown.has(cid)) extraFromConvert.push(cid); }

        if (extraFromConvert.length > 0) {
            warnings.push(`suit_convert has ${extraFromConvert.length} extra items for "${itemName}": ${extraFromConvert.join(', ')}`);
            for (const extraId of extraFromConvert) {
                const idx = idMap[extraId];
                if (!idx) { errors.push(`Extra suit_convert ID ${extraId} not found (suit: ${itemName})`); continue; }
                const r = generateLine(idx, '', '', `${itemName}·染`);
                if (r.error) { errors.push(r.error); continue; }
                results.push(r);
            }
        }
    }
}

// === Output ===
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

let output = `// Generated by make_wardrobe1.js\n`;
output += `// Items: ${results.length} | Errors: ${errors.length} | Warnings: ${warnings.length}\n`;
output += `// Copy these lines into wardrobe1.js\n\n`;
for (const r of results) output += r.line + '\n';
if (errors.length > 0) { output += `\n// === ERRORS ===\n`; for (const e of errors) output += `// ${e}\n`; }
if (warnings.length > 0) { output += `\n// === WARNINGS ===\n`; for (const w of warnings) output += `// ${w}\n`; }

fs.writeFileSync(outputPath, output.replace(/\r\n/g, '\n'));
console.log(`\n=> ${results.length} lines written to ${outputPath}`);
if (warnings.length) { console.log(`\n⚠ ${warnings.length} warnings:`); for (const w of warnings) console.log(`  ⚠ ${w}`); }
if (errors.length) { console.log(`\n❌ ${errors.length} errors:`); for (const e of errors) console.log(`  - ${e}`); }
console.log('\n--- Output preview ---');
for (const r of results) console.log(r.line);
