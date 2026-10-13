const fs = require('fs');

// Load gazetteers
const foodsGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/foods_gazetteer.json', 'utf8'));
const nutrientsGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/nutrients_gazetteer.json', 'utf8'));
const conditionsGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/conditions_gazetteer.json', 'utf8'));
const allergensGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/allergens_gazetteer.json', 'utf8'));
const ageGroupsGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/age_groups_gazetteer.json', 'utf8'));
const mealTypesGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/meal_types_gazetteer.json', 'utf8'));
const growthMetricsGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/growth_metrics_gazetteer.json', 'utf8'));

// Build unified pattern dictionary with priority weights
// Higher weight = higher priority in overlap resolution
const entityPatterns = [];

function addPatterns(gazList, label, priority) {
    gazList.forEach(item => {
        const terms = [item.surface_form, ...(item.aliases || [])];
        terms.forEach(term => {
            if (!term || term.length < 2) return;
            entityPatterns.push({
                term: term.trim(),
                label: label,
                priority: priority,
                canonical: item.canonical_form || item.surface_form
            });
        });
    });
}

// Precedence ordering:
// 1. ALLERGEN (highest priority, safety critical)
// 2. GROWTH_METRIC
// 3. HEALTH_CONDITION
// 4. NUTRIENT
// 5. FOOD
// 6. MEAL_TYPE
// 7. AGE_GROUP
addPatterns(allergensGaz, "ALLERGEN", 70);
addPatterns(growthMetricsGaz, "GROWTH_METRIC", 60);
addPatterns(conditionsGaz, "HEALTH_CONDITION", 50);
addPatterns(nutrientsGaz, "NUTRIENT", 40);
addPatterns(foodsGaz, "FOOD", 30);
addPatterns(mealTypesGaz, "MEAL_TYPE", 20);
addPatterns(ageGroupsGaz, "AGE_GROUP", 10);

// Sort patterns by term length descending (longest match first)
entityPatterns.sort((a, b) => b.term.length - a.term.length);

function extractSentences(text) {
    // Splits text into sentences while preserving sentence offsets
    const sentenceRegex = /[^.!?\n]+[.!?\n]+/g;
    const sentences = [];
    let match;
    let lastIndex = 0;

    while ((match = sentenceRegex.exec(text)) !== null) {
        const s = match[0].trim();
        if (s.length > 5) {
            sentences.push(s);
        }
        lastIndex = sentenceRegex.lastIndex;
    }
    if (lastIndex < text.length) {
        const remaining = text.slice(lastIndex).trim();
        if (remaining.length > 5) {
            sentences.push(remaining);
        }
    }
    return sentences.length > 0 ? sentences : [text.trim()];
}

function annotateText(sentence) {
    const rawMatches = [];

    entityPatterns.forEach(pat => {
        // Regex word boundary matching with case insensitivity
        const escaped = pat.term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        // Word boundary that works with hyphens and alphanumeric
        const regex = new RegExp('(^|[^a-zA-Z0-9])(' + escaped + ')([^a-zA-Z0-9]|$)', 'gi');
        
        let m;
        while ((m = regex.exec(sentence)) !== null) {
            const prefix = m[1];
            const matchedText = m[2];
            const start = m.index + prefix.length;
            const end = start + matchedText.length;

            rawMatches.push({
                start: start,
                end: end,
                label: pat.label,
                text: sentence.slice(start, end),
                priority: pat.priority,
                length: end - start
            });
        }
    });

    // Resolve overlapping entities based on length, priority, and precedence rules
    // Sort candidate matches: first by start asc, then by length desc, then by priority desc
    rawMatches.sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        if (b.length !== a.length) return b.length - a.length;
        return b.priority - a.priority;
    });

    const resolved = [];
    const occupied = new Array(sentence.length).fill(false);

    rawMatches.forEach(candidate => {
        // Check if any character in candidate span is already occupied
        let isOccupied = false;
        for (let i = candidate.start; i < candidate.end; i++) {
            if (occupied[i]) {
                isOccupied = true;
                break;
            }
        }

        if (!isOccupied) {
            // Check contextual exclusion rules
            // 1. If text is 'iron' and immediately followed by 'deficiency anemia' or preceded by 'deficiency'
            // and occupied by HEALTH_CONDITION, it won't be matched anyway because span is occupied.
            // 2. Ignore pure non-domain terms or single numbers
            if (candidate.text.trim().length > 1) {
                resolved.push({
                    start: candidate.start,
                    end: candidate.end,
                    label: candidate.label,
                    text: candidate.text
                });
                for (let i = candidate.start; i < candidate.end; i++) {
                    occupied[i] = true;
                }
            }
        }
    });

    // Sort resolved entities by character start offset
    resolved.sort((a, b) => a.start - b.start);
    return resolved;
}

// Tokenize and build BIO tags
function convertToBio(sentence, entities) {
    // Simple white-space / punctuation aware tokenization
    const tokenRegex = /\w+|[^\w\s]/g;
    const tokens = [];
    let match;
    while ((match = tokenRegex.exec(sentence)) !== null) {
        tokens.push({
            text: match[0],
            start: match.index,
            end: match.index + match[0].length
        });
    }

    const bioTags = tokens.map(tok => {
        // Check which entity covers this token
        const coveringEntity = entities.find(e => tok.start >= e.start && tok.end <= e.end);
        if (!coveringEntity) {
            return "O";
        }
        // If token starts at the entity start or is the first token inside
        if (tok.start === coveringEntity.start) {
            return `B-${coveringEntity.label}`;
        } else {
            return `I-${coveringEntity.label}`;
        }
    });

    return {
        tokens: tokens.map(t => t.text),
        bio_tags: bioTags
    };
}

// Load primary datasets
const ragData = JSON.parse(fs.readFileSync('ai-service-v2/datasets/rag_data.json', 'utf8'));
const queriesData = JSON.parse(fs.readFileSync('ai-service-v2/evaluation/retrieval_dataset.json', 'utf8'));
const fixturesData = JSON.parse(fs.readFileSync('tests/fixtures/eval_fixtures.json', 'utf8'));

const annotatedRecords = [];
let sentIdCounter = 1;

// 1. Process RAG data
ragData.forEach(ragItem => {
    const sents = extractSentences(ragItem.text);
    sents.forEach((sent, idx) => {
        const ents = annotateText(sent);
        const bio = convertToBio(sent, ents);
        annotatedRecords.push({
            id: `nutri_rag_${String(sentIdCounter++).padStart(5, '0')}`,
            source: "rag_data.json",
            source_record_id: ragItem.id,
            source_passage_index: idx,
            text: sent,
            entities: ents,
            tokens: bio.tokens,
            bio_tags: bio.bio_tags,
            annotation_source: "gazetteer_rule",
            is_synthetic: false
        });
    });
});

// 2. Process Caregiver Queries
queriesData.forEach((qItem, idx) => {
    const qText = qItem.query;
    const ents = annotateText(qText);
    const bio = convertToBio(qText, ents);
    annotatedRecords.push({
        id: `nutri_query_${String(sentIdCounter++).padStart(5, '0')}`,
        source: "retrieval_dataset.json",
        source_record_id: `QUERY_${idx + 1}`,
        source_passage_index: 0,
        text: qText,
        entities: ents,
        tokens: bio.tokens,
        bio_tags: bio.bio_tags,
        annotation_source: "gazetteer_rule",
        is_synthetic: false
    });
});

// 3. Process Clinical Test Fixtures
fixturesData.parent_mode_tests.forEach((pItem, idx) => {
    const pText = pItem.prompt;
    const sents = extractSentences(pText);
    sents.forEach((sent, sIdx) => {
        const ents = annotateText(sent);
        const bio = convertToBio(sent, ents);
        annotatedRecords.push({
            id: `nutri_fixture_${String(sentIdCounter++).padStart(5, '0')}`,
            source: "eval_fixtures.json",
            source_record_id: pItem.id || `FIXTURE_${idx + 1}`,
            source_passage_index: sIdx,
            text: sent,
            entities: ents,
            tokens: bio.tokens,
            bio_tags: bio.bio_tags,
            annotation_source: "gazetteer_rule",
            is_synthetic: false
        });
    });
});

// Write weak annotations JSONL
const jsonlContent = annotatedRecords.map(r => JSON.stringify(r)).join('\n');
fs.writeFileSync('ner/data/weak_annotations.jsonl', jsonlContent, 'utf8');

console.log(`Generated ${annotatedRecords.length} annotated sentence records in ner/data/weak_annotations.jsonl`);
let totalEnts = 0;
const counts = {};
annotatedRecords.forEach(r => {
    totalEnts += r.entities.length;
    r.entities.forEach(e => counts[e.label] = (counts[e.label] || 0) + 1);
});
console.log(`Total entity spans extracted: ${totalEnts}`);
console.log('Entity span breakdown:', counts);
