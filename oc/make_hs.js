const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

function parseArgs(argv) {
    const args = {
        choiceDir: path.resolve(__dirname, '../../nikkis_choice'),
        output: null,
        limit: Infinity,
        workers: Math.min(8, os.availableParallelism()),
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--choice-dir') {
            if (!argv[i + 1]) throw new Error('--choice-dir requires a path');
            args.choiceDir = path.resolve(process.cwd(), argv[++i]);
        } else if (arg === '--output') {
            if (!argv[i + 1]) throw new Error('--output requires a path');
            args.output = path.resolve(process.cwd(), argv[++i]);
        } else if (arg === '--limit') {
            const limit = Number(argv[++i]);
            if (!Number.isInteger(limit) || limit < 1) throw new Error('--limit requires a positive integer');
            args.limit = limit;
        } else if (arg === '--workers') {
            const workers = Number(argv[++i]);
            if (!Number.isInteger(workers) || workers < 1) throw new Error('--workers requires a positive integer');
            args.workers = workers;
        } else if (arg === '--help' || arg === '-h') {
            console.log('Usage: node make_hs.js [--choice-dir PATH] [--output PATH] [--limit N] [--workers N]');
            process.exit(0);
        } else {
            throw new Error(`Unknown option: ${arg}`);
        }
    }

    if (!args.output) args.output = path.join(args.choiceDir, 'data', 'levels-hs.js');
    return args;
}

function loadEngine(choiceDir) {
    const context = vm.createContext({
        console,
        alert(message) {
            throw new Error(`Unexpected alert: ${message}`);
        },
        $: {
            inArray(value, array) {
                return array == null ? -1 : Array.prototype.indexOf.call(array, value);
            },
        },
    });

    const files = [
        'data/wardrobe.js',
        'data/exc.js',
        'scoring.js',
        'data/levels.js',
        'data/flist.js',
        'model.js',
    ];

    for (const relativePath of files) {
        const filePath = path.join(choiceDir, relativePath);
        if (!fs.existsSync(filePath)) throw new Error(`Required file not found: ${filePath}`);
        vm.runInContext(fs.readFileSync(filePath, 'utf8'), context, {
            filename: filePath,
            timeout: 30_000,
        });
    }

    const requiredArrays = ['FEATURES', 'category', 'skipCategory', 'clothes'];
    for (const name of requiredArrays) {
        if (!Array.isArray(context[name])) throw new Error(`${name} was not loaded correctly`);
    }
    const requiredObjects = ['tasksRaw', 'levelsRaw', 'allThemes', 'shoppingCart'];
    for (const name of requiredObjects) {
        if (!context[name] || typeof context[name] !== 'object') {
            throw new Error(`${name} was not loaded correctly`);
        }
    }
    return context;
}

// Keep the decimal multiplication behavior used by nikki.js.
function accMul(arg1, arg2) {
    let decimals = 0;
    const s1 = arg1.toString();
    const s2 = arg2.toString();
    if (s1.includes('.')) decimals += s1.split('.')[1].length;
    if (s2.includes('.')) decimals += s2.split('.')[1].length;
    return Number(s1.replace('.', '')) * Number(s2.replace('.', '')) / Math.pow(10, decimals);
}

function makeCriteria(engine, themeName, level, boost1, boost2) {
    const criteria = {};
    for (const feature of engine.FEATURES) {
        const rawWeight = Number(level.weight[feature]);
        if (!Number.isFinite(rawWeight)) {
            throw new Error(`Invalid ${feature} weight in ${themeName}`);
        }

        let weight = Math.abs(rawWeight);
        if (!weight) weight = 1;
        if (feature === boost1) {
            weight = accMul(weight, 1.27);
            criteria.highscore1 = feature;
        }
        if (feature === boost2) {
            weight = accMul(weight, 1.778);
            criteria.highscore2 = feature;
        }
        criteria[feature] = rawWeight < 0 ? -weight : weight;
    }

    criteria.levelName = themeName;
    if (level.bonus && level.bonus.length) {
        criteria.bonus = [];
        for (const info of level.bonus) {
            const factory = info.replace ? engine.replaceScoreBonusFactory : engine.addScoreBonusFactory;
            criteria.bonus.push(factory(info.base, info.weight, info.tag)(criteria));
        }
    }
    if (level.additionalBonus && level.additionalBonus.length) {
        if (!criteria.bonus) criteria.bonus = [];
        criteria.bonus.push(...level.additionalBonus);
    }
    return criteria;
}

function totalForCart(engine, result, criteria, accessoryCount) {
    const cart = engine.shoppingCart;
    cart.clear();
    cart.putAll(result);
    cart.validate(criteria, accessoryCount);
    cart.calc(criteria);
    return cart.totalScore.sumScore;
}

function findBestBoosts(engine, themeName, level) {
    const { clothes, FEATURES } = engine;
    const accessoryCount = engine.accCateNum;
    const baseCriteria = makeCriteria(engine, themeName, level, null, null);
    const originalScores = new Array(clothes.length);

    for (let i = 0; i < clothes.length; i++) {
        clothes[i].calc(baseCriteria);
        originalScores[i] = engine.realSumScore(clothes[i], accessoryCount);
    }

    let bestScore = 0;
    let bestBoosts = null;

    // This ordering deliberately matches autogenLimit(): boost2 is the outer
    // loop and boost1 is the inner loop. Strict > preserves its tie behavior.
    for (const boost2 of FEATURES) {
        for (const boost1 of FEATURES) {
            if (boost1 === boost2) continue;
            const criteria = makeCriteria(engine, themeName, level, boost1, boost2);
            const scoreByCategoryNormal = {};
            const scoreByCategoryPose = {};
            const resultNormal = {};
            const resultPose = {};

            for (let i = 0; i < clothes.length; i++) {
                const item = clothes[i];
                const category = item.type.type;
                if (engine.skipCategory.indexOf(category) >= 0) continue;
                // autogenLimit checks the state left by the base/previous pass
                // before recalculating. Retain that detail for identical output.
                if (item.isF || item.sumScore <= 0) continue;
                if (!scoreByCategoryNormal[category]) scoreByCategoryNormal[category] = 0;
                if (!scoreByCategoryPose[category]) scoreByCategoryPose[category] = 0;

                if (item.pose) {
                    if (originalScores[i] * 1.778 < scoreByCategoryPose[category]) continue;
                    item.calc(criteria);
                    const score = engine.realSumScore(item, accessoryCount);
                    if (score > scoreByCategoryPose[category]) {
                        resultPose[category] = item;
                        scoreByCategoryPose[category] = score;
                    }
                } else {
                    if (originalScores[i] * 1.778 < scoreByCategoryNormal[category]) continue;
                    item.calc(criteria);
                    const score = engine.realSumScore(item, accessoryCount);
                    if (score > scoreByCategoryNormal[category]) {
                        resultNormal[category] = item;
                        scoreByCategoryNormal[category] = score;
                    }
                }
            }

            for (const category in scoreByCategoryNormal) {
                if (scoreByCategoryNormal[category] >= scoreByCategoryPose[category]) {
                    resultPose[category] = resultNormal[category];
                }
            }

            const poseScore = totalForCart(engine, resultPose, criteria, accessoryCount);
            const normalScore = totalForCart(engine, resultNormal, criteria, accessoryCount);
            const score = poseScore > normalScore ? poseScore : normalScore;
            if (score > bestScore) {
                bestScore = score;
                bestBoosts = [boost1, boost2];
            }
        }
    }

    engine.shoppingCart.clear();
    if (!bestBoosts) throw new Error(`No valid boost combination found for ${themeName}`);
    return { boosts: bestBoosts, score: bestScore };
}

function themeEntries(engine) {
    const entries = [];
    for (const name in engine.tasksRaw) {
        if (engine.allThemes[name]) entries.push([name, engine.allThemes[name]]);
    }
    for (const levelName in engine.levelsRaw) {
        const name = `关卡: ${levelName}`;
        if (engine.allThemes[name]) entries.push([name, engine.allThemes[name]]);
    }
    return entries;
}

function formatDuration(milliseconds) {
    const seconds = milliseconds / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
}

function calculateEntries(choiceDir, indices) {
    const engine = loadEngine(choiceDir);
    const entries = themeEntries(engine);
    const results = [];
    for (const index of indices) {
        const [name, level] = entries[index];
        const result = findBestBoosts(engine, name, level);
        results.push({ index, name, boosts: result.boosts, score: result.score });
        if (!isMainThread) parentPort.postMessage({ type: 'progress', name });
    }
    return { results, wardrobeCount: engine.clothes.length, totalLevels: entries.length };
}

function runWorker(choiceDir, indices, onProgress) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, { workerData: { choiceDir, indices } });
        const results = [];
        worker.on('message', (message) => {
            if (message.type === 'progress') {
                onProgress(message.name);
            } else if (message.type === 'results') {
                results.push(...message.results);
            } else if (message.type === 'error') {
                reject(new Error(message.error));
            }
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code === 0) resolve(results);
            else reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const startedAt = Date.now();
    console.log(`Loading scoring engine from ${args.choiceDir}`);
    // Load once in the main thread for validation and to discover stable indices.
    const inspectionEngine = loadEngine(args.choiceDir);
    const allEntries = themeEntries(inspectionEngine);
    const count = Math.min(args.limit, allEntries.length);
    const indices = Array.from({ length: count }, (_, index) => index);
    const workerCount = Math.min(args.workers, count);
    console.log(`Wardrobe: ${inspectionEngine.clothes.length} items | Levels: ${count}/${allEntries.length} | Workers: ${workerCount}`);

    let completed = 0;
    let lastName = '';
    const onProgress = (name) => {
        completed++;
        lastName = name;
        if (completed % 10 === 0 || completed === count) {
            console.log(`[${completed}/${count}] ${lastName} (${formatDuration(Date.now() - startedAt)})`);
        }
    };

    let results;
    if (workerCount === 1) {
        results = [];
        const engine = inspectionEngine;
        for (const index of indices) {
            const [name, level] = allEntries[index];
            const result = findBestBoosts(engine, name, level);
            results.push({ index, name, boosts: result.boosts, score: result.score });
            onProgress(name);
        }
    } else {
        const chunks = Array.from({ length: workerCount }, () => []);
        for (let i = 0; i < indices.length; i++) chunks[i % workerCount].push(indices[i]);
        const promises = chunks.map((chunk) => runWorker(args.choiceDir, chunk, onProgress));
        results = (await Promise.all(promises)).flat();
    }

    results.sort((a, b) => a.index - b.index);
    const lines = results.map((result) =>
        `'${result.name}':['${result.boosts[0]}','${result.boosts[1]}'],`
    );

    const eol = '\r\n';
    const output = `var tasksAdd={${eol}${lines.join(eol)}${eol}};${eol}`;
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, output, 'utf8');
    console.log(`Generated ${args.output}`);
    console.log(`Done in ${formatDuration(Date.now() - startedAt)}`);
}

if (isMainThread) {
    main().catch((error) => {
        console.error(`Error: ${error.stack || error.message}`);
        process.exitCode = 1;
    });
} else {
    try {
        const calculated = calculateEntries(workerData.choiceDir, workerData.indices);
        parentPort.postMessage({ type: 'results', results: calculated.results });
    } catch (error) {
        parentPort.postMessage({ type: 'error', error: error.stack || error.message });
        process.exitCode = 1;
    }
}
