const fs = require('fs');
const path = require('path');

function getStats(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return null;
    }
    
    let records = Array.isArray(data) ? data.length : Object.keys(data).length;
    let sentences = 0;
    let approxTokens = 0;

    if (Array.isArray(data)) {
        data.forEach(item => {
            let text = item.text || item.query || item.prompt || item.food_name || item.condition_name || item.allergy || item.goal_name || '';
            if (typeof text === 'string' && text.length > 0) {
                // approximate sentence split
                const sents = text.split(/(?<=[.?!])\s+/).filter(Boolean);
                sentences += sents.length;
                approxTokens += text.split(/\s+/).filter(Boolean).length;
            }
        });
    }

    return {
        sizeBytes: stat.size,
        records,
        sentences: sentences || records,
        approxTokens
    };
}

const sources = [
    {
        filename: "ai-service-v2/datasets/rag_data.json",
        sourceType: "RAG Knowledge Base",
        domain: "Clinical Pediatric Nutrition & Guidelines",
        isNaturalLanguage: true,
        usedForAnnotation: true,
        usedForGazetteer: true,
        usedForEvaluation: false
    },
    {
        filename: "ai-service-v2/evaluation/retrieval_dataset.json",
        sourceType: "User Query Benchmark",
        domain: "Parental & Caregiver Queries",
        isNaturalLanguage: true,
        usedForAnnotation: true,
        usedForGazetteer: false,
        usedForEvaluation: true
    },
    {
        filename: "tests/fixtures/eval_fixtures.json",
        sourceType: "Clinical Safety Benchmarks",
        domain: "Pediatric Clinical Safety Test Prompts",
        isNaturalLanguage: true,
        usedForAnnotation: true,
        usedForGazetteer: false,
        usedForEvaluation: true
    },
    {
        filename: "ai-service-v2/evaluation/retrieval_failures.json",
        sourceType: "Diagnostic Retrieval Log",
        domain: "Query-Passage Mismatches",
        isNaturalLanguage: true,
        usedForAnnotation: false,
        usedForGazetteer: false,
        usedForEvaluation: true
    },
    {
        filename: "ai-service-v2/datasets/foods.json",
        sourceType: "Food Database",
        domain: "Nutritional Composition (ICMR/IFCT)",
        isNaturalLanguage: false,
        usedForAnnotation: false,
        usedForGazetteer: true,
        usedForEvaluation: false
    },
    {
        filename: "ai-service-v2/datasets/conditions.json",
        sourceType: "Clinical Rules Catalog",
        domain: "Pediatric Conditions & Dietary Adaptations",
        isNaturalLanguage: false,
        usedForAnnotation: false,
        usedForGazetteer: true,
        usedForEvaluation: false
    },
    {
        filename: "ai-service-v2/datasets/allergies.json",
        sourceType: "Allergen Catalog",
        domain: "Food Allergens & Severities",
        isNaturalLanguage: false,
        usedForAnnotation: false,
        usedForGazetteer: true,
        usedForEvaluation: false
    },
    {
        filename: "ai-service-v2/datasets/goals.json",
        sourceType: "Dietary Goals Catalog",
        domain: "Nutritional & Growth Objectives",
        isNaturalLanguage: false,
        usedForAnnotation: false,
        usedForGazetteer: true,
        usedForEvaluation: false
    }
];

const inventory = [];

sources.forEach(src => {
    const stats = getStats(src.filename);
    inventory.push({
        ...src,
        records: stats ? stats.records : 0,
        sentences: stats ? stats.sentences : 0,
        approxTokens: stats ? stats.approxTokens : 0,
        sizeBytes: stats ? stats.sizeBytes : 0
    });
});

fs.writeFileSync('ner/reports/corpus_inventory.json', JSON.stringify(inventory, null, 2), 'utf8');

// Generate Markdown
let md = `# NutriBite Machine-Readable Corpus Inventory\n\n`;
md += `This inventory provides exact, programmatically measured statistics of all data assets in the NutriBite corpus used for NER dataset construction, gazetteer induction, and model evaluation.\n\n`;
md += `| Source Filename | Source Type | Records | Sentences | Approx. Tokens | Size (Bytes) | Nature | Annotation Target? | Gazetteer Source? | Evaluation? |\n`;
md += `| :--- | :--- | ---: | ---: | ---: | ---: | :--- | :---: | :---: | :---: |\n`;

inventory.forEach(inv => {
    md += `| \`${inv.filename}\` | ${inv.sourceType} | ${inv.records} | ${inv.sentences} | ${inv.approxTokens} | ${inv.sizeBytes} | ${inv.isNaturalLanguage ? 'Natural Language' : 'Structured'} | ${inv.usedForAnnotation ? 'Yes' : 'No'} | ${inv.usedForGazetteer ? 'Yes' : 'No'} | ${inv.usedForEvaluation ? 'Yes' : 'No'} |\n`;
});

md += `\n### Corpus Summary Totals:\n`;
const totalRecords = inventory.reduce((acc, x) => acc + x.records, 0);
const totalSents = inventory.filter(x => x.isNaturalLanguage).reduce((acc, x) => acc + x.sentences, 0);
const totalTokens = inventory.filter(x => x.isNaturalLanguage).reduce((acc, x) => acc + x.approxTokens, 0);
const totalBytes = inventory.reduce((acc, x) => acc + x.sizeBytes, 0);

md += `- **Total Raw Records Across All Files:** ${totalRecords}\n`;
md += `- **Total Natural Language Sentences Available:** ${totalSents}\n`;
md += `- **Total Approximate Natural Language Tokens:** ${totalTokens}\n`;
md += `- **Total Corpus Byte Size:** ${(totalBytes / 1024).toFixed(1)} KB (${totalBytes} bytes)\n`;

fs.writeFileSync('ner/reports/corpus_inventory.md', md, 'utf8');
console.log('Corpus inventory generated successfully in ner/reports/');
