'use strict';

const xlsx = require('xlsx');

/**
 * DisplayName = clothes_data col B + F品白名单 col O/P -> [夜]/[昼] suffix.
 * col O id -> name + [夜], col P id -> name + [昼] (consistent with F品白名单 VLOOKUP logic).
 *
 * @param {import('xlsx').WorkBook} wb
 * @returns {{ nightIds: Set<number>, dayIds: Set<number>, dayNightPartner: Map<number, number>, sheetFound: boolean }}
 * dayNightPartner: when O(夜) and P(昼) are paired, bidirectional id->partner id, for make_wardrobe1 to complete items with the missing partner.
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
 * @param {any[]} clothesRow clothes_data row (A=id, B=name, …)
 * @param {number|string} id item id (usually clothesRow[0])
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

/** escape single quotes in wardrobe1 line */
function escapeForWardrobeLine(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

module.exports = {
    loadDayNightWhitelist,
    displayClothesName,
    escapeForWardrobeLine,
};
