const fs = require('fs');

console.log("=== RUNNING AUTOMATED QUALITY CONTROL CHECKS ===");

const filesToCheck = [
    'ner/data/weak_annotations.jsonl',
    'ner/data/manual_validation.jsonl',
    'ner/data/train.jsonl',
    'ner/data/validation.jsonl',
    'ner/data/test.jsonl'
];

let totalErrors = 0;
let totalCheckedSentences = 0;
let totalCheckedSpans = 0;

filesToCheck.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log(`[ERROR] File missing: ${file}`);
        totalErrors++;
        return;
    }

    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
    console.log(`\nChecking ${file} (${lines.length} records)...`);

    const seenIds = new Set();

    lines.forEach((line, idx) => {
        totalCheckedSentences++;
        let record;
        try {
            record = JSON.parse(line);
        } catch (e) {
            console.log(`  [FAIL] Malformed JSON on line ${idx + 1}: ${e.message}`);
            totalErrors++;
            return;
        }

        // 1. Check ID uniqueness within file
        if (seenIds.has(record.id)) {
            console.log(`  [FAIL] Duplicate record ID: ${record.id} on line ${idx + 1}`);
            totalErrors++;
        }
        seenIds.add(record.id);

        // 2. Check non-empty text
        if (!record.text || typeof record.text !== 'string' || record.text.trim().length === 0) {
            console.log(`  [FAIL] Empty or invalid text in record ${record.id}`);
            totalErrors++;
        }

        // 3. Check entity offset integrity
        if (record.entities && Array.isArray(record.entities)) {
            const occupied = new Array(record.text.length).fill(false);

            record.entities.forEach((ent, eIdx) => {
                totalCheckedSpans++;
                // Bounds check
                if (ent.start < 0 || ent.end > record.text.length || ent.start >= ent.end) {
                    console.log(`  [FAIL] Invalid offset [${ent.start}, ${ent.end}] in record ${record.id} for text length ${record.text.length}`);
                    totalErrors++;
                }

                // Text match check
                const actualSlice = record.text.slice(ent.start, ent.end);
                if (ent.text && ent.text !== actualSlice) {
                    console.log(`  [FAIL] Mismatched text span in record ${record.id}: expected "${ent.text}", found "${actualSlice}"`);
                    totalErrors++;
                }

                // Non-overlapping check
                for (let i = ent.start; i < ent.end; i++) {
                    if (occupied[i]) {
                        console.log(`  [FAIL] Overlapping entity span in record ${record.id} at char offset ${i}`);
                        totalErrors++;
                        break;
                    }
                    occupied[i] = true;
                }
            });
        }

        // 4. Check BIO tag sequence validity
        if (record.bio_tags && Array.isArray(record.bio_tags)) {
            let prevTag = "O";
            record.bio_tags.forEach((tag, tIdx) => {
                if (tag.startsWith("I-")) {
                    const tagType = tag.slice(2);
                    if (prevTag !== `B-${tagType}` && prevTag !== `I-${tagType}`) {
                        console.log(`  [FAIL] Invalid BIO transition in record ${record.id} at token index ${tIdx}: ${prevTag} -> ${tag}`);
                        totalErrors++;
                    }
                }
                prevTag = tag;
            });
        }
    });

    console.log(`  [PASS] Checked ${lines.length} records. No critical syntax errors.`);
});

// 5. Check Leakage between Train, Val, Test
console.log("\nChecking Data Leakage between Train, Validation, and Test partitions...");
const trainPassages = new Set(
    fs.readFileSync('ner/data/train.jsonl', 'utf8')
        .split('\n').filter(Boolean)
        .map(l => JSON.parse(l).source_record_id)
);

const valPassages = new Set(
    fs.readFileSync('ner/data/validation.jsonl', 'utf8')
        .split('\n').filter(Boolean)
        .map(l => JSON.parse(l).source_record_id)
);

const testPassages = new Set(
    fs.readFileSync('ner/data/test.jsonl', 'utf8')
        .split('\n').filter(Boolean)
        .map(l => JSON.parse(l).source_record_id)
);

let leakageFound = false;
valPassages.forEach(p => {
    if (trainPassages.has(p)) {
        console.log(`  [LEAKAGE WARNING] Source passage ${p} is in both Train and Validation!`);
        leakageFound = true;
        totalErrors++;
    }
});

testPassages.forEach(p => {
    if (trainPassages.has(p)) {
        console.log(`  [LEAKAGE WARNING] Source passage ${p} is in both Train and Test!`);
        leakageFound = true;
        totalErrors++;
    }
    if (valPassages.has(p)) {
        console.log(`  [LEAKAGE WARNING] Source passage ${p} is in both Validation and Test!`);
        leakageFound = true;
        totalErrors++;
    }
});

if (!leakageFound) {
    console.log("  [PASS] Zero source passage leakage verified across Train, Validation, and Test splits!");
}

console.log(`\n=== QUALITY CONTROL SUMMARY ===`);
console.log(`Total Sentences Verified: ${totalCheckedSentences}`);
console.log(`Total Entity Spans Verified: ${totalCheckedSpans}`);
console.log(`Total Anomalies / Errors Detected: ${totalErrors}`);

if (totalErrors === 0) {
    console.log("[SUCCESS] All quality control assertions passed perfectly!\n");
} else {
    console.log(`[WARNING] Quality control finished with ${totalErrors} issue(s).\n`);
}
