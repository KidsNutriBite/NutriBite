const fs = require('fs');

// Load all gazetteers
const gazetteers = {
    FOOD: JSON.parse(fs.readFileSync('ner/data/gazetteers/foods_gazetteer.json', 'utf8')),
    NUTRIENT: JSON.parse(fs.readFileSync('ner/data/gazetteers/nutrients_gazetteer.json', 'utf8')),
    HEALTH_CONDITION: JSON.parse(fs.readFileSync('ner/data/gazetteers/conditions_gazetteer.json', 'utf8')),
    ALLERGEN: JSON.parse(fs.readFileSync('ner/data/gazetteers/allergens_gazetteer.json', 'utf8')),
    AGE_GROUP: JSON.parse(fs.readFileSync('ner/data/gazetteers/age_groups_gazetteer.json', 'utf8')),
    MEAL_TYPE: JSON.parse(fs.readFileSync('ner/data/gazetteers/meal_types_gazetteer.json', 'utf8')),
    GROWTH_METRIC: JSON.parse(fs.readFileSync('ner/data/gazetteers/growth_metrics_gazetteer.json', 'utf8'))
};

// Also load structured food DB for full enrichment
const foodsDb = JSON.parse(fs.readFileSync('ai-service-v2/datasets/foods.json', 'utf8'));
const foodIdMap = {};
foodsDb.forEach(f => {
    foodIdMap[f.food_id] = f;
});

function normalizeString(s) {
    return s.toLowerCase().replace(/_/g, ' ').replace(/[-\/\\^$*+?.()|[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
}

function linkEntity(text, label) {
    const gazList = gazetteers[label] || [];
    const normText = normalizeString(text);

    // 1. Exact match against surface_form or canonical_form
    for (const item of gazList) {
        if (normalizeString(item.surface_form) === normText || normalizeString(item.canonical_form) === normText) {
            return formatLinkedRecord(item, label, text, "exact_match");
        }
    }

    // 2. Alias match
    for (const item of gazList) {
        if (item.aliases) {
            for (const alias of item.aliases) {
                if (normalizeString(alias) === normText) {
                    return formatLinkedRecord(item, label, text, "alias_match");
                }
            }
        }
    }

    // 3. Substring / partial match
    for (const item of gazList) {
        const itemNorm = normalizeString(item.surface_form);
        if (normText.includes(itemNorm) || itemNorm.includes(normText)) {
            return formatLinkedRecord(item, label, text, "partial_match");
        }
    }

    // Fallback if not in gazetteer
    return {
        surface_text: text,
        label: label,
        canonical_id: `UNLINKED_${label}_${normalizeString(text).replace(/\s+/g, '_').toUpperCase()}`,
        canonical_name: text.toLowerCase(),
        match_type: "unlinked_fallback",
        db_record: null
    };
}

function formatLinkedRecord(item, label, originalText, matchType) {
    let canonicalId = item.food_id || item.nutrient_id || item.condition_name || item.allergen_id || item.age_group_id || item.meal_type_id || item.metric_id || `CANON_${label}_${item.canonical_form.toUpperCase()}`;
    let dbRecord = null;

    if (label === 'FOOD' && item.food_id && foodIdMap[item.food_id]) {
        dbRecord = foodIdMap[item.food_id];
    }

    return {
        surface_text: originalText,
        label: label,
        canonical_id: canonicalId,
        canonical_name: item.canonical_form || item.surface_form,
        match_type: matchType,
        category: item.category || null,
        db_record: dbRecord
    };
}

function linkEntities(entities) {
    return entities.map(e => ({
        ...e,
        linked: linkEntity(e.text, e.label)
    }));
}

// Module export & test CLI
if (require.main === module) {
    console.log("=== NUTRIBITE ENTITY LINKER DEMONSTRATION ===");
    const testCases = [
        { text: "ragi porridge", label: "FOOD" },
        { text: "moong dal khichdi", label: "FOOD" },
        { text: "vitamin D", label: "NUTRIENT" },
        { text: "vit B12", label: "NUTRIENT" },
        { text: "iron deficiency anemia", label: "HEALTH_CONDITION" },
        { text: "peanut allergy", label: "ALLERGEN" },
        { text: "lactose intolerance", label: "ALLERGEN" },
        { text: "toddler", label: "AGE_GROUP" },
        { text: "breakfast", label: "MEAL_TYPE" },
        { text: "MUAC", label: "GROWTH_METRIC" }
    ];

    const results = linkEntities(testCases);
    results.forEach(r => {
        console.log(`\nSurface Text: "${r.text}" [${r.label}]`);
        console.log(`  -> Canonical ID:   ${r.linked.canonical_id}`);
        console.log(`  -> Canonical Name: ${r.linked.canonical_name}`);
        console.log(`  -> Match Type:     ${r.linked.match_type}`);
        if (r.linked.db_record) {
            console.log(`  -> DB Energy/100g: ${r.linked.db_record.energy_kcal_per_100g || 'N/A'} kcal | Category: ${r.linked.db_record.category}`);
        }
    });

    // Write report
    let md = `# NutriBite Entity Linking Examples and Proof of Concept\n\n`;
    md += `This document demonstrates how Named Entity Recognition (NER) outputs are programmatically mapped to canonical database IDs in the NutriBite database.\n\n`;
    md += `| Surface Text | Extracted Label | Canonical ID | Canonical Concept | Match Strategy | Structured DB Integration |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    results.forEach(r => {
        md += `| \`${r.text}\` | **\`${r.label}\`** | \`${r.linked.canonical_id}\` | ${r.linked.canonical_name} | \`${r.linked.match_type}\` | ${r.linked.db_record ? `Mapped to \`foods.json\` (${r.linked.db_record.category})` : 'Gazetteer Grounding'} |\n`;
    });

    fs.writeFileSync('ner/reports/entity_linking_examples.md', md, 'utf8');
    console.log("\nEntity linking report written to ner/reports/entity_linking_examples.md");
}

module.exports = { linkEntity, linkEntities };
