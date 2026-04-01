'use strict';

const xlsx = require('xlsx');

/**
 * 显示名 = clothes_data B 列 + F品白名单昼夜后缀（不做 Excel 里 L 列的 !/# 前缀）。
 * O 列 id → 名字后加 [夜]，P 列 id → [昼]（与 F品白名单 VLOOKUP 逻辑一致）。
 *
 * @param {import('xlsx').WorkBook} wb
 * @returns {{ nightIds: Set<number>, dayIds: Set<number>, dayNightPartner: Map<number, number>, sheetFound: boolean }}
 * dayNightPartner: 同一行 O(夜) 与 P(昼) 均有时，双向 id→配对 id，供 make_wardrobe1 把成就里只列了一边的衣服补全另一边。
 */
function loadDayNightWhitelist(wb) {
    const nightIds = new Set();
    const dayIds = new Set();
    /** @type {Map<number, number>} */
    const dayNightPartner = new Map();
    let sh = wb.Sheets['F品白名单'];
    if (!sh) {
        const keys = Object.keys(wb.Sheets);
        const hit = keys.find((k) => k.replace(/\s/g, '').includes('F品白名单') || (k.includes('F') && k.includes('白名单')));
        if (hit) sh = wb.Sheets[hit];
    }
    if (!sh) return { nightIds, dayIds, dayNightPartner, sheetFound: false };

    const data = xlsx.utils.sheet_to_json(sh, { header: 1, defval: null });
    const colO = 14; // Excel O
    const colP = 15; // Excel P
    function parseId(cell) {
        if (cell == null || cell === '') return null;
        const n = typeof cell === 'number' ? cell : parseInt(String(cell).trim(), 10);
        return Number.isNaN(n) ? null : n;
    }
    for (let r = 1; r < data.length; r++) {
        const row = data[r];
        if (!row) continue;
        const oId = parseId(row[colO]);
        const pId = parseId(row[colP]);
        if (oId != null) nightIds.add(oId);
        if (pId != null) dayIds.add(pId);
        if (oId != null && pId != null) {
            dayNightPartner.set(oId, pId);
            dayNightPartner.set(pId, oId);
        }
    }
    return { nightIds, dayIds, dayNightPartner, sheetFound: true };
}

/**
 * @param {any[]} clothesRow clothes_data 一行（A=id, B=name, …）
 * @param {number|string} id 衣服 id（通常 clothesRow[0]）
 * @param {Set<number>} nightIds
 * @param {Set<number>} dayIds
 */
function displayClothesName(clothesRow, id, nightIds, dayIds) {
    const base = clothesRow[1] != null ? String(clothesRow[1]) : '';
    if (!base) return '';

    const idNum = Number(id);
    let suffix = '';
    if (nightIds.has(idNum)) suffix += '[夜]';
    if (dayIds.has(idNum)) suffix += '[昼]';

    return base + suffix;
}

/** 写入 wardrobe1 行时的单引号转义 */
function escapeForWardrobeLine(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

module.exports = {
    loadDayNightWhitelist,
    displayClothesName,
    escapeForWardrobeLine,
};
