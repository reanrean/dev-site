'use strict';

const fs = require('fs');
const path = require('path');

/** Comma-separated rows; .txt extension so *.csv gitignore / tooling does not treat it as input data. */
const OVERRIDES_FILE = 'id_overrides.txt';

/**
 * Loads id_overrides.txt (CSV-shaped) next to this module.
 * @returns {{ hardcodeNo: Record<number, string>, uidRemap: Record<string, string> }}
 */
function loadIdOverrides(dir = __dirname) {
    const filePath = path.join(dir, OVERRIDES_FILE);
    const hardcodeNo = {};
    const uidRemap = {};

    if (!fs.existsSync(filePath)) {
        console.warn(`Warning: ${OVERRIDES_FILE} not found in ${dir}; no id overrides loaded.`);
        return { hardcodeNo, uidRemap };
    }

    const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;
        const cells = line.split(',').map((c) => c.trim());
        if (cells.length < 2) continue;
        const [fromUid, toUid, itemNo] = cells;
        if (/^from_uid$/i.test(fromUid)) continue;

        if (toUid) uidRemap[String(fromUid)] = String(toUid);

        if (itemNo) {
            const id = parseInt(fromUid, 10);
            if (!Number.isNaN(id)) hardcodeNo[id] = itemNo;
        }
    }

    return { hardcodeNo, uidRemap };
}

module.exports = { loadIdOverrides, OVERRIDES_FILE };
