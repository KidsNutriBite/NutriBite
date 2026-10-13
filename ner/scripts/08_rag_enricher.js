const fs = require('fs');
const { linkEntities } = require('./07_entity_linker');

// Experimental Query Preprocessor & Metadata Enricher for RAG
function enrichRagQuery(userQuery) {
    // 1. Run domain NER extraction logic
    // (Import annotator logic)
    const foodsGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/foods_gazetteer.json', 'utf8'));
    const nutrientsGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/nutrients_gazetteer.json', 'utf8'));
    const conditionsGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/conditions_gazetteer.json', 'utf8'));
    const allergensGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/allergens_gazetteer.json', 'utf8'));
    const ageGroupsGaz = JSON.parse(fs.readFileSync('ner/data/gazetteers/age_groups_gazetteer.json', 'utf8'));

    const rawMatches = [];

    function matchGaz(gazList, label) {
        gazList.forEach(item => {
            const terms = [item.surface_form, ...(item.aliases || [])];
            terms.forEach(t => {
                if (!t || t.length < 2) return;
                const esc = t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const re = new RegExp('(^|[^a-zA-Z0-9])(' + esc + ')([^a-zA-Z0-9]|$)', 'gi');
                let m;
                while ((m = re.exec(userQuery)) !== null) {
                    const start = m.index + m[1].length;
                    const end = start + m[2].length;
                    rawMatches.push({
                        start, end, label, text: userQuery.slice(start, end)
                    });
                }
            });
        });
    }

    matchGaz(allergensGaz, "ALLERGEN");
    matchGaz(conditionsGaz, "HEALTH_CONDITION");
    matchGaz(nutrientsGaz, "NUTRIENT");
    matchGaz(foodsGaz, "FOOD");
    matchGaz(ageGroupsGaz, "AGE_GROUP");

    // Overlap resolution
    rawMatches.sort((a, b) => (b.end - b.start) - (a.end - a.start));
    const resolved = [];
    const occ = new Array(userQuery.length).fill(false);
    rawMatches.forEach(c => {
        let isOcc = false;
        for (let i = c.start; i < c.end; i++) {
            if (occ[i]) { isOcc = true; break; }
        }
        if (!isOcc) {
            resolved.push(c);
            for (let i = c.start; i < c.end; i++) occ[i] = true;
        }
    });

    resolved.sort((a, b) => a.start - b.start);

    // 2. Link entities to canonical concepts
    const linked = linkEntities(resolved);

    // 3. Construct structured RAG retrieval payload
    const structuredMetadata = {
        foods: linked.filter(e => e.label === 'FOOD').map(e => e.linked.canonical_name),
        nutrients: linked.filter(e => e.label === 'NUTRIENT').map(e => e.linked.canonical_name),
        conditions: linked.filter(e => e.label === 'HEALTH_CONDITION').map(e => e.linked.canonical_name),
        allergens: linked.filter(e => e.label === 'ALLERGEN').map(e => e.linked.canonical_name),
        age_groups: linked.filter(e => e.label === 'AGE_GROUP').map(e => e.linked.canonical_name)
    };

    // 4. Generate optimized dense search terms
    const denseSearchTerms = [
        ...structuredMetadata.nutrients,
        ...structuredMetadata.foods,
        ...structuredMetadata.conditions,
        ...structuredMetadata.age_groups
    ].join(' ');

    return {
        original_query: userQuery,
        extracted_entities: linked.map(e => ({
            span: e.text,
            label: e.label,
            start: e.start,
            end: e.end,
            canonical_id: e.linked.canonical_id
        })),
        structured_metadata_filter: structuredMetadata,
        augmented_retrieval_query: denseSearchTerms || userQuery,
        is_experimental: true
    };
}

if (require.main === module) {
    console.log("=== EXPERIMENTAL RAG QUERY ENRICHMENT PROTOTYPE ===");
    const sampleQuery = "What iron rich food can I give my 2yo toddler who has diarrhea?";
    const enriched = enrichRagQuery(sampleQuery);
    console.log("\nOriginal User Query:");
    console.log(`"${enriched.original_query}"`);
    console.log("\nExtracted Domain Entities:");
    console.log(JSON.stringify(enriched.extracted_entities, null, 2));
    console.log("\nStructured Retrieval Filter Payload:");
    console.log(JSON.stringify(enriched.structured_metadata_filter, null, 2));
    console.log("\nAugmented Retrieval Search String:");
    console.log(`"${enriched.augmented_retrieval_query}"`);
}

module.exports = { enrichRagQuery };
