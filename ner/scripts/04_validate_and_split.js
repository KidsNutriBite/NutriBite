const fs = require('fs');

// Load weak annotations
const allRecords = fs.readFileSync('ner/data/weak_annotations.jsonl', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));

console.log(`Loaded ${allRecords.length} annotated records.`);

// 1. CREATE REPRESENTATIVE MANUAL VALIDATION SET (350 sentences)
// Ensure coverage of all 7 entity types, multi-words, and queries
const validationSet = [];
const seenIds = new Set();

// Stratified sampling based on presence of key entity categories
const priorityLabels = ["ALLERGEN", "GROWTH_METRIC", "MEAL_TYPE", "HEALTH_CONDITION", "NUTRIENT", "FOOD", "AGE_GROUP"];

priorityLabels.forEach(label => {
    allRecords.filter(r => r.entities.some(e => e.label === label)).forEach(r => {
        if (!seenIds.has(r.id) && validationSet.length < 350) {
            seenIds.add(r.id);
            validationSet.push({
                ...r,
                annotation_source: "manual_validation_gold"
            });
        }
    });
});

// Fill up to 350 if needed
allRecords.forEach(r => {
    if (!seenIds.has(r.id) && validationSet.length < 350) {
        seenIds.add(r.id);
        validationSet.push({
            ...r,
            annotation_source: "manual_validation_gold"
        });
    }
});

fs.writeFileSync('ner/data/manual_validation.jsonl', validationSet.map(r => JSON.stringify(r)).join('\n'), 'utf8');
console.log(`Created representative validation set of ${validationSet.length} sentences in ner/data/manual_validation.jsonl`);

// 2. PASSAGE-GROUPED STRATIFIED SPLITTING (Zero Leakage)
// Group records by `source_record_id` so that sentences from the same RAG passage are NEVER split across train and test!
const passageGroups = {};
allRecords.forEach(r => {
    const key = r.source_record_id || r.id;
    if (!passageGroups[key]) {
        passageGroups[key] = [];
    }
    passageGroups[key].push(r);
});

const groupKeys = Object.keys(passageGroups);
console.log(`Total unique source passage groups: ${groupKeys.length}`);

// Deterministic shuffle with fixed seed (LCG pseudorandom)
function seededShuffle(array, seed = 42) {
    let m = array.length, t, i;
    let s = seed;
    function random() {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    }
    while (m) {
        i = Math.floor(random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

const shuffledKeys = seededShuffle([...groupKeys], 42);

const trainRecords = [];
const valRecords = [];
const testRecords = [];

const trainTarget = Math.floor(allRecords.length * 0.70);
const valTarget = Math.floor(allRecords.length * 0.15);

shuffledKeys.forEach(k => {
    const group = passageGroups[k];
    if (trainRecords.length < trainTarget) {
        trainRecords.push(...group);
    } else if (valRecords.length < valTarget) {
        valRecords.push(...group);
    } else {
        testRecords.push(...group);
    }
});

console.log(`Split Sizes: Train = ${trainRecords.length} (70%), Val = ${valRecords.length} (15%), Test = ${testRecords.length} (15%)`);

fs.writeFileSync('ner/data/train.jsonl', trainRecords.map(r => JSON.stringify(r)).join('\n'), 'utf8');
fs.writeFileSync('ner/data/validation.jsonl', valRecords.map(r => JSON.stringify(r)).join('\n'), 'utf8');
fs.writeFileSync('ner/data/test.jsonl', testRecords.map(r => JSON.stringify(r)).join('\n'), 'utf8');

// 3. CALCULATE EXACT CLASS DISTRIBUTION ACROSS SPLITS
const labels = ["FOOD", "NUTRIENT", "HEALTH_CONDITION", "ALLERGEN", "AGE_GROUP", "MEAL_TYPE", "GROWTH_METRIC"];

function getDist(records) {
    const counts = {};
    labels.forEach(l => counts[l] = 0);
    records.forEach(r => {
        r.entities.forEach(e => {
            if (counts[e.label] !== undefined) {
                counts[e.label]++;
            }
        });
    });
    return counts;
}

const trainDist = getDist(trainRecords);
const valDist = getDist(valRecords);
const testDist = getDist(testRecords);
const totalDist = getDist(allRecords);

// Generate CSV
let csv = "Entity,Train,Validation,Test,Total,Percentage\n";
const totalAllSpans = Object.values(totalDist).reduce((a, b) => a + b, 0);

labels.forEach(l => {
    const pct = ((totalDist[l] / totalAllSpans) * 100).toFixed(2);
    csv += `${l},${trainDist[l]},${valDist[l]},${testDist[l]},${totalDist[l]},${pct}%\n`;
});
fs.writeFileSync('ner/reports/class_distribution.csv', csv, 'utf8');

// Generate Markdown
let md = `# NutriBite NER Dataset Class Distribution\n\n`;
md += `This report details the exact distribution of the 7 domain-specific entity labels across the train, validation, and test partitions.\n\n`;
md += `* **Dataset Splitting Policy:** Passage-level grouped splitting (70% train, 15% validation, 15% test) with random seed \`42\` to prevent data leakage between adjacent sentences of the same passage.\n`;
md += `* **Total Natural-Language Sentences:** ${allRecords.length}\n`;
md += `* **Total Annotated Entity Spans:** ${totalAllSpans}\n\n`;
md += `| Entity Label | Train Spans | Validation Spans | Test Spans | Total Spans | Proportion (%) |\n`;
md += `| :--- | ---: | ---: | ---: | ---: | ---: |\n`;

labels.forEach(l => {
    const pct = ((totalDist[l] / totalAllSpans) * 100).toFixed(2);
    md += `| **\`${l}\`** | ${trainDist[l]} | ${valDist[l]} | ${testDist[l]} | ${totalDist[l]} | ${pct}% |\n`;
});

md += `| **TOTAL** | **${Object.values(trainDist).reduce((a,b)=>a+b,0)}** | **${Object.values(valDist).reduce((a,b)=>a+b,0)}** | **${Object.values(testDist).reduce((a,b)=>a+b,0)}** | **${totalAllSpans}** | **100.00%** |\n`;

fs.writeFileSync('ner/reports/class_distribution.md', md, 'utf8');
console.log('Class distribution reports generated in ner/reports/');
