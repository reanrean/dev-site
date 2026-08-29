const fs = require('fs');
const path = require('path');
const vm = require('vm');

const choiceDir = path.resolve(__dirname, '../../nikkis_choice');
const inputPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.join(choiceDir, 'data', 'wardrobe1.js');
const outputPath = process.argv[3]
    ? path.resolve(process.cwd(), process.argv[3])
    : path.join(choiceDir, 'data', 'wardrobe.js');

function loadWardrobe1(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`wardrobe1.js not found: ${filePath}`);
    }

    const context = Object.create(null);
    vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), context, {
        filename: filePath,
        timeout: 30_000,
    });

    for (const name of ['wardrobe1', 'category', 'skipCategory', 'repelCates']) {
        if (!Array.isArray(context[name])) {
            throw new Error(`${name} is missing or is not an array in ${filePath}`);
        }
    }
    if (typeof context.wardrobe_lastupd !== 'string') {
        throw new Error(`wardrobe_lastupd is missing in ${filePath}`);
    }
    return context;
}

function num2letter(i) {
    if (i >= 64 || i <= 0) return '0';
    if (i === 62) return '-';
    if (i === 63) return '_';
    if (i < 10) return i;
    if (i <= 35) return String.fromCharCode(i + 55);
    return String.fromCharCode(i + 61);
}

function num2code(i) {
    let ret = '';
    if (i < 0) return ret;
    do {
        ret = num2letter(i % 64) + ret;
        i = Math.floor(i / 64);
    } while (i > 0);
    return ret;
}

function stat2num(stat1, stat2) {
    const positive = { C: 0, B: 1, A: 2, S: 3, SS: 4, SSS: 5 };
    const negative = { C: 6, B: 7, A: 8, S: 9, SS: 10, SSS: 11 };
    if (Object.prototype.hasOwnProperty.call(positive, stat1)) return positive[stat1];
    if (Object.prototype.hasOwnProperty.call(negative, stat2)) return negative[stat2];
    return 0;
}

function stat2code(star, num1, num2, num3, num4, num5) {
    let num = star;
    num = num * 12 + num5;
    num = num * 12 + num4;
    num = num * 12 + num3;
    num = num * 12 + num2;
    num = num * 12 + num1;
    return num2code(num);
}

function decoderSource() {
    return `var wardrobe = function() {
    var ret = [];
    for (var i in codewardrobe) {
        var item = [];
        var w = codewardrobe[i].split('|');
        item.push(w[0]);
        item.push(category[code2num(w[1].charAt(0))]);
        item.push(numberToInventoryId(code2num(w[1].substr(1))));
        item = item.concat(code2stat(w[2].charAt(0)=='*' ? w[2].substr(1) : w[2]));
        if (w[3] == '' || w[3].indexOf('+')>0) item.push(w[3]);
        else item.push(code2tag[code2num(w[3].charAt(0))] + (w[3].length > 1 ? '/' + code2tag[code2num(w[3].charAt(1))] : '' ));
        var w6s = w[6].split('/'), srcs = [];
        for (var s in w6s) {
            if (w6s[s].charAt(0) == '*') srcs.push('套装·' + code2suit[code2num(w6s[s].substr(1))]);
            else if (w6s[s].charAt(0) == '@') srcs.push('设·定' + numberToInventoryId(code2num(w6s[s].substr(1))));
            else if (w6s[s].charAt(0) == '!') srcs.push('设·进' + numberToInventoryId(code2num(w6s[s].substr(1))));
            else if (w6s[s].charAt(0) == '~') srcs.push('梦境·' + w6s[s].substr(1));
            else if (iscode(w6s[s])) srcs.push(code2src[code2num(w6s[s])]);
            else srcs.push(w6s[s]);
        }
        item.push(srcs.join('/'));
        if (w[4] == '') item.push('');
        else if (w[4].charAt(0) == '*') item.push(code2suit[code2num(w[4].substr(1))] + '·套');
        else if (w[4].charAt(0) == '@') item.push(code2suit[code2num(w[4].substr(1))] + '·染');
        else if (w[4].charAt(0) == '!') item.push(code2suit[code2num(w[4].substr(1))] + '·基');
        else item.push(code2suit[code2num(w[4])]);
        item.push(code2ver[code2num(w[5])]);
        item.push(w[7].charAt(0)=='*' ? '套·' + code2ssrc[code2num(w[7].substr(1))] : code2ssrc[code2num(w[7])]);
        item.push(w[2].charAt(0)=='*' ? '1' : '');
        ret.push(item);
    }
    return ret;
}();
function letter2num(s) {
    var charcode = s.charCodeAt(0);
    if (charcode == 45) return 62;
    else if (charcode == 95) return 63;
    else if (charcode <= 57) return charcode - 48;
    else if (charcode <= 90) return charcode - 55;
    else return charcode - 61;
}
function code2num(s) {
    var len = s.length;
    var num = 0;
    for (var i = 0; i<len; i++) num = 64 * num + letter2num(s.charAt(i));
    return num;
}
function code2stat(s) {
    var num2stat = ['C|', 'B|', 'A|', 'S|', 'SS|', 'SSS|', '|C', '|B', '|A', '|S', '|SS', '|SSS'];
    var ret = [];
    var num = code2num(s);
    for (var i = 0; i < 5; i++) {
        ret = ret.concat(num2stat[num % 12].split('|'));
        num = Math.floor(num / 12);
    }
    ret.unshift(num.toString());
    return ret;
}
function numberToInventoryId(s) {
    if (s < 10) return '00' + s;
    if (s < 100) return '0' + s;
    else return s.toString();
}
function iscode(s) {
    for (var i = 1; i < s.length; i++) {
        c = s.charCodeAt(i);
        if (!(c==33 || c==42 || c==45 || c==95 || (c>=48&&c<=57) || (c>=64&&c<=90) || (c>=97&&c<=122))) return false;
    }
    return true;
}
`;
}

function generate(data) {
    const { wardrobe1, category, skipCategory, repelCates, wardrobe_lastupd } = data;
    let output = `var category = ['${category.join("','")}'];\n`;
    output += `var skipCategory = [${skipCategory.length > 0 ? `'${skipCategory.join("','")}'` : ''}];\n`;
    output += 'var repelCates = [';
    for (const group of repelCates) output += `['${group.join("','")}'],`;
    output += '];\n';

    const cat2code = Object.create(null);
    for (let i = 0; i < category.length; i++) cat2code[category[i]] = num2code(i);

    const tag2code = Object.create(null), code2tag = [];
    const suit2code = Object.create(null), code2suit = [];
    const ver2code = Object.create(null), code2ver = [];
    const src2code = Object.create(null), code2src = [];
    const ssrc2code = Object.create(null), code2ssrc = [];

    function addCode(map, values, value) {
        if (!map[value]) {
            map[value] = num2code(values.length);
            values.push(value);
        }
    }

    for (const w of wardrobe1) {
        const tagstr = w[14];
        if (tagstr !== '' && tagstr.indexOf('+') < 0) {
            const tags = tagstr.split('/');
            if (tags[0]) addCode(tag2code, code2tag, tags[0]);
            if (tags[1]) addCode(tag2code, code2tag, tags[1]);
        }

        const suitstr = w[16];
        if (suitstr && suitstr.indexOf('·套') < 0 && suitstr.indexOf('·染') < 0 && suitstr.indexOf('·基') < 0) {
            addCode(suit2code, code2suit, suitstr);
        }

        if (w[17]) addCode(ver2code, code2ver, w[17]);

        const ssrcstr = w[18].replace(/^套·/, '');
        if (ssrcstr) addCode(ssrc2code, code2ssrc, ssrcstr);

        if (w[15]) {
            for (const src of w[15].split('/')) {
                if (src.indexOf('公') === src.length - 1) continue;
                if (src.indexOf('少') === src.length - 1) continue;
                if (src.indexOf('设·定') === 0) continue;
                if (src.indexOf('设·进') === 0) continue;
                if (src.indexOf('梦境·') === 0 && src !== '梦境·浮梦岛') continue;
                if (src.indexOf('套装·') === 0) continue;
                if (src.indexOf('剧情') === 0) continue;
                if (src.indexOf('故宫-') === 0) continue;
                addCode(src2code, code2src, src);
            }
        }
    }

    output += `var code2tag = ['${code2tag.join("','")}'];\n`;
    output += `var code2suit = ['${code2suit.join("','")}'];\n`;
    output += `var code2ver = ['${code2ver.join("','")}'];\n`;
    output += `var code2src = ['${code2src.join("','")}'];\n`;
    output += `var code2ssrc = ['${code2ssrc.join("','")}'];\n`;
    output += 'var codewardrobe = [\n';

    for (const w of wardrobe1) {
        if (!Object.prototype.hasOwnProperty.call(cat2code, w[1])) {
            throw new Error(`Unknown category "${w[1]}" for ${w[0]} (${w[2]})`);
        }

        let encoded = `${w[0]}|${cat2code[w[1]]}${num2code(w[2])}|`;
        if (w[19]) encoded += '*';
        encoded += stat2code(
            w[3],
            stat2num(w[4], w[5]),
            stat2num(w[6], w[7]),
            stat2num(w[8], w[9]),
            stat2num(w[10], w[11]),
            stat2num(w[12], w[13]),
        ) + '|';

        if (w[14]) {
            if (w[14].indexOf('+') >= 0) encoded += w[14];
            else {
                const tags = w[14].split('/');
                if (tags[0]) encoded += tag2code[tags[0]];
                if (tags[1]) encoded += tag2code[tags[1]];
            }
        }
        encoded += '|';

        if (w[16]) {
            if (suit2code[w[16]]) encoded += suit2code[w[16]];
            else if (w[16].indexOf('·套') > 0) encoded += '*' + suit2code[w[16].replace(/·套/, '')];
            else if (w[16].indexOf('·染') > 0) encoded += '@' + suit2code[w[16].replace(/·染/, '')];
            else if (w[16].indexOf('·基') > 0) encoded += '!' + suit2code[w[16].replace(/·基/, '')];
            else encoded += w[16];
        }
        encoded += '|';
        encoded += (ver2code[w[17]] ? ver2code[w[17]] : w[17]) + '|';

        const encodedSources = [];
        for (const src of w[15].split('/')) {
            if (src2code[src]) encodedSources.push(src2code[src]);
            else if (src.indexOf('套装·') === 0) encodedSources.push('*' + suit2code[src.replace(/套装·/, '')]);
            else if (src.indexOf('设·定') === 0) encodedSources.push('@' + num2code(src.replace(/设·定/, '')));
            else if (src.indexOf('设·进') === 0) encodedSources.push('!' + num2code(src.replace(/设·进/, '')));
            else if (src.indexOf('梦境·') === 0) encodedSources.push('~' + src.replace(/梦境·/, ''));
            else encodedSources.push(src);
        }
        encoded += encodedSources.join('/') + '|';

        if (w[18]) {
            const prefix = w[18].indexOf('套·') === 0 ? '*' : '';
            const suffix = w[18].replace(/^套·/, '');
            encoded += ssrc2code[suffix] ? prefix + ssrc2code[suffix] : w[18];
        }
        output += `'${encoded}',\n`;
    }

    output += '];\n\n';
    output += decoderSource();
    output += `var wardrobe_lastupd = '${wardrobe_lastupd}';`;
    return output;
}

try {
    const data = loadWardrobe1(inputPath);
    const output = generate(data);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    // FileSaver.js used by maint.html prepends a UTF-8 BOM for this MIME type.
    fs.writeFileSync(outputPath, '\uFEFF' + output, 'utf8');
    console.log(`Generated ${outputPath}`);
    console.log(`Items: ${data.wardrobe1.length} | Last update: ${data.wardrobe_lastupd}`);
} catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
}
