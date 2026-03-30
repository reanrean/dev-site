const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// --- AUTO-DETECT FILES IN SCRIPT DIRECTORY ---
const cwd = __dirname;
const files = fs.readdirSync(cwd);

const xlsmFile = files.find(f => f.endsWith('.xlsm'));
if (!xlsmFile) { console.error('Error: No .xlsm file found in current directory.'); process.exit(1); }
const excelPath = path.join(cwd, xlsmFile);

const csvFile = files.find(f => f.endsWith('.csv'));
if (!csvFile) { console.error('Error: No .csv file found in current directory.'); process.exit(1); }
const guildCsvPath = path.join(cwd, csvFile);

const outputPathF = path.join(cwd, 'f.js');
const outputPathNK = path.join(cwd, 'levels_nk.txt');
const outputPathSeal = path.join(cwd, 'levels_seal.txt');

// --- HELPER: Extract level name (X) from 关卡属性 col3 ---
function extractLevelName(a) {
    if (!a) return '';
    a = String(a);
    if (a.startsWith('卷') && !a.includes('其他')) {
        const firstSpaceIdx = a.indexOf(' ');
        if (firstSpaceIdx === -1) return '';
        const dashified = a.substring(0, firstSpaceIdx) + '-' + a.substring(firstSpaceIdx + 1);
        const secondSpaceIdx = dashified.indexOf(' ');
        if (secondSpaceIdx === -1) return '';
        let levelName = dashified.substring(0, secondSpaceIdx);
        levelName = levelName.replace('卷I-', '');
        levelName = levelName.replace('卷I', 'I');
        return levelName;
    }
    if (a.startsWith('竞技场')) return a.replace('竞技场:', '');
    if (a.startsWith('联盟')) {
        const spaceIdx = a.indexOf(' ', 4);
        if (spaceIdx === -1) return '';
        return a.substring(0, spaceIdx).replace('联盟', '联盟委托: ');
    }
    return '';
}

// --- HELPER: f.js key prefix ---
function fKey(levelName) {
    if (!levelName) return '';
    const first = levelName[0];
    if (/\d/.test(first) || first === 'I') return '关卡: ' + levelName;
    return levelName;
}

// --- Number formatting helpers ---
function fmtNK(val) {
    const r = Math.round(val * 10000) / 10000;
    return String(r);
}
function fmtSeal(val) {
    const r = Math.round(val * 100) / 100;
    return String(r);
}

// --- MAIN ---
try {
    console.log("Using xlsm:", xlsmFile);
    console.log("Using csv:", csvFile);
    const wb = xlsx.readFile(excelPath);

    // ========== STEP 1: Build level data from 关卡属性 ==========
    const levelSheet = xlsx.utils.sheet_to_json(wb.Sheets['关卡属性'], { header: 1 });
    const taskToLevel = {};

    for (let i = 1; i < levelSheet.length; i++) {
        const row = levelSheet[i];
        const id = row[0];
        const col3 = String(row[3] || '');
        const levelName = extractLevelName(col3);
        if (!levelName) continue;
        taskToLevel[id] = levelName;
    }
    console.log(`Mapped ${Object.keys(taskToLevel).length} task IDs`);

    // ========== STEP 2: 联盟属性 ==========
    const guildSheet = xlsx.utils.sheet_to_json(wb.Sheets['联盟属性'], { header: 1 });
    console.log(`Loaded ${guildSheet.length - 1} guild levels from 联盟属性`);

    // ========== STEP 3: Build f.js data from 关卡属性 ==========
    const flistWhite = {};
    const flistBlack = {};
    const flistWhiteRange = {};

    for (let i = 1; i < levelSheet.length; i++) {
        const row = levelSheet[i];
        const id = row[0];
        const col3 = String(row[3] || '');
        const levelName = extractLevelName(col3);
        if (!levelName) continue;
        if (id % 10 !== 2) continue;

        const key = fKey(levelName);

        const qData = String(row[19] || '');
        if (qData) {
            const items = qData.split(',').filter(v => v.trim()).map(Number).filter(v => !isNaN(v) && v !== 0);
            if (items.length > 0) flistWhite[key] = items;
        }

        let rData = String(row[20] || '');
        if (rData) {
            if (rData.length > 32750) {
                const commaPos = rData.indexOf(',', 32739);
                if (commaPos !== -1) rData = rData.substring(0, commaPos);
            }
            const items = rData.split(',').filter(v => v.trim()).map(Number).filter(v => !isNaN(v) && v !== 0);
            if (items.length > 0) flistBlack[key] = items;
        }

        const sData = String(row[21] || '');
        if (sData) {
            const items = sData.split(',').filter(v => v.trim()).map(Number).filter(v => !isNaN(v) && v !== 0);
            if (items.length > 0) flistWhiteRange[key] = items;
        }
    }

    console.log(`White: ${Object.keys(flistWhite).length}, Range: ${Object.keys(flistWhiteRange).length}, Black(关卡): ${Object.keys(flistBlack).length}`);

    // ========== STEP 4: Guild black list from CSV ==========
    const csvLines = fs.readFileSync(guildCsvPath, 'utf8').trim().split('\n');
    const guildKeys = new Set();
    let guildCount = 0;

    for (let i = 1; i < csvLines.length; i++) {
        const line = csvLines[i];
        const idx = line.indexOf(',');
        if (idx === -1) continue;
        let arrStr = line.substring(idx + 1).trim();
        const id = parseInt(line.substring(0, idx), 10);
        if (id < 1000 || !arrStr.includes('[')) continue;
        if (arrStr.startsWith('"') && arrStr.endsWith('"')) arrStr = arrStr.slice(1, -1);

        const main = Math.floor(id / 1000);
        const sub = id % 1000;
        const key = '联盟委托: ' + main + '-' + sub;
        const items = arrStr.replace(/[\[\]]/g, '').split(',').filter(v => v.trim()).map(Number).filter(v => !isNaN(v) && v !== 0);
        if (items.length > 0) { flistBlack[key] = items; guildKeys.add(key); guildCount++; }
    }
    console.log(`Black(guild CSV): ${guildCount}, Black total: ${Object.keys(flistBlack).length}`);

    // ========== STEP 5: Write f.js ==========
    function formatFlistBlack(obj, gKeys) {
        const guildEntries = [];
        const levelEntries = [];
        for (const key of Object.keys(obj)) {
            const arr = obj[key];
            const trail = gKeys.has(key) ? '' : ',';
            const line = `'${key}':[${arr.join(',')}${trail}]`;
            if (gKeys.has(key)) guildEntries.push(line);
            else levelEntries.push(line);
        }
        const parts = [];
        if (guildEntries.length) parts.push(guildEntries.join(',\n'));
        if (levelEntries.length) parts.push(levelEntries.join(',\n'));
        return '{\n' + parts.join(',\n\n') + ',\n}';
    }

    function formatObj(obj) {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        return '{\n' + keys.map(k => `'${k}':[${obj[k].join(',')},]`).join(',\n') + ',\n}';
    }

    let fOutput = '//公主\nvar flistExtra={};\n';
    fOutput += 'var flistWhite=' + formatObj(flistWhite) + ';\n';
    fOutput += 'var flistWhiteRange=' + formatObj(flistWhiteRange) + ';\n';
    fOutput += 'var flistBlack=' + formatFlistBlack(flistBlack, guildKeys) + ';\n';

    fs.writeFileSync(outputPathF, fOutput.replace(/\r\n/g, '\n'));
    console.log(`=> f.js written to ${outputPathF}`);

    // ========== STEP 6: Generate levels snippets ==========
    let nkRaw = '';
    let nkBonus = '';
    let sealRaw = '';
    let sealSkills = '';

    const processedLevels = new Set();

    for (let i = 1; i < levelSheet.length; i++) {
        const row = levelSheet[i];
        const id = row[0];
        const col3 = String(row[3] || '');
        const levelName = extractLevelName(col3);
        if (!levelName) continue;
        if (id % 10 !== 2) continue;
        if (processedLevels.has(levelName)) continue;
        processedLevels.add(levelName);

        const style1 = row[4], style2 = row[5], style3 = row[6], style4 = row[7], style5 = row[8];
        const val1 = row[9] || 0, val2 = row[10] || 0, val3 = row[11] || 0, val4 = row[12] || 0, val5 = row[13] || 0;
        const s1 = style1 === '简约' ? 1 : -1;
        const s3 = style3 === '可爱' ? 1 : -1;
        const s2 = style2 === '活泼' ? 1 : -1;
        const s4 = style4 === '清纯' ? 1 : -1;
        const s5 = style5 === '清凉' ? 1 : -1;

        const raw = [s1*val1/15, s3*val3/15, s2*val2/15, s4*val4/15, s5*val5/15];

        nkRaw += `'${levelName}':[${raw.map(fmtNK).join(',')}],\n`;
        sealRaw += `  '${levelName}': [${raw.map(fmtSeal).join(', ')}],\n`;

        const tag1 = row[14] || '', tag1val = row[15] || 0;
        const tag2 = row[16] || '', tag2val = row[17] || 0;
        if (tag1 || tag2) {
            let parts = [];
            if (tag1) parts.push(`addBonusInfo('F',${tag1val},'${tag1}')`);
            if (tag2) parts.push(`addBonusInfo('F',${tag2val},'${tag2}')`);
            nkBonus += `'${levelName}':[${parts.join(',')}],\n`;
        }

        let regSkills = [];
        if (i > 1 && levelSheet[i-1][0] === id - 1) {
            regSkills = [levelSheet[i-1][22], levelSheet[i-1][23], levelSheet[i-1][24], levelSheet[i-1][25]]
                .map(v => v || '').filter(v => v.trim() !== '');
        }
        let advSkills = [row[22], row[23], row[24], row[25]]
            .map(v => v || '').filter(v => v.trim() !== '');

        const regArr = regSkills.length > 0 ? `['${regSkills.join("','")}']` : 'null';
        const advArr = advSkills.length > 0 ? `['${advSkills.join("','")}']` : 'null';
        sealSkills += `'${levelName}': [${regArr},${advArr}],\n`;
    }

    let nkGuildRaw = '';
    let sealGuildRaw = '';
    let nkGuildBonus = '';
    let sealGuildSkills = '';

    for (let i = 1; i < guildSheet.length; i++) {
        const row = guildSheet[i];
        const col3 = String(row[3] || '');
        const levelName = extractLevelName(col3);
        if (!levelName) continue;

        const style1 = row[4], style2 = row[5], style3 = row[6], style4 = row[7], style5 = row[8];
        const val1 = row[9] || 0, val2 = row[10] || 0, val3 = row[11] || 0, val4 = row[12] || 0, val5 = row[13] || 0;
        const s1 = style1 === '简约' ? 1 : -1;
        const s3 = style3 === '可爱' ? 1 : -1;
        const s2 = style2 === '活泼' ? 1 : -1;
        const s4 = style4 === '清纯' ? 1 : -1;
        const s5 = style5 === '清凉' ? 1 : -1;
        const raw = [s1*val1/15, s3*val3/15, s2*val2/15, s4*val4/15, s5*val5/15];

        nkGuildRaw += `'${levelName}':[${raw.map(fmtNK).join(',')}],\n`;
        sealGuildRaw += `  '${levelName}': [${raw.map(fmtSeal).join(', ')}],\n`;

        const tag1 = row[14] || '', tag1val = row[15] || 0;
        const tag2 = row[16] || '', tag2val = row[17] || 0;
        if (tag1 || tag2) {
            let parts = [];
            if (tag1) parts.push(`addBonusInfo('F',${tag1val},'${tag1}')`);
            if (tag2) parts.push(`addBonusInfo('F',${tag2val},'${tag2}')`);
            nkGuildBonus += `'${levelName}':[${parts.join(',')}],\n`;
        }

        const skills = [row[19], row[20], row[21], row[22]].map(v => v || '').filter(v => v.trim() !== '');
        const skillArr = skills.length > 0 ? `['${skills.join("','")}']` : 'null';
        sealGuildSkills += `'${levelName}': [null,null,${skillArr}],\n`;
    }

    let nkOutput = '// === nikkis_choice tasksRaw (联盟) ===\n' + nkGuildRaw;
    nkOutput += '\n// === nikkis_choice tasksRaw (关卡) ===\n' + nkRaw;
    nkOutput += '\n// === nikkis_choice levelBonus (联盟, F format) ===\n' + nkGuildBonus;
    nkOutput += '\n// === nikkis_choice levelBonus (关卡, F format) ===\n' + nkBonus;

    fs.writeFileSync(outputPathNK, nkOutput.replace(/\r\n/g, '\n'));
    console.log(`=> levels_nk.txt written to ${outputPathNK}`);

    let sealOutput = '// === seal100x tasksRaw (联盟) ===\n' + sealGuildRaw;
    sealOutput += '\n// === seal100x tasksRaw (关卡) ===\n' + sealRaw;
    sealOutput += '\n// === seal100x addSkillsInfo (关卡) ===\n' + sealSkills;
    sealOutput += '\n// === seal100x addSkillsInfo (联盟) ===\n' + sealGuildSkills;

    fs.writeFileSync(outputPathSeal, sealOutput.replace(/\r\n/g, '\n'));
    console.log(`=> levels_seal.txt written to ${outputPathSeal}`);

    // ========== Diff check ==========
    const existingF = path.join(cwd, '..', 'nk', 'f.js');
    if (fs.existsSync(existingF)) {
        const existing = fs.readFileSync(existingF, 'utf8');
        for (const v of ['flistWhite', 'flistBlack', 'flistWhiteRange']) {
            const m = existing.match(new RegExp("var " + v + "=\\{([\\s\\S]*?)\\};"));
            if (m) {
                const cnt = (m[1].match(/'/g) || []).length / 2;
                const newCnt = Object.keys(v === 'flistWhite' ? flistWhite : v === 'flistBlack' ? flistBlack : flistWhiteRange).length;
                console.log(`${v}: existing ~${Math.round(cnt)} entries, new ${newCnt}`);
            }
        }
    }

} catch (error) {
    console.error('Error:', error);
}
