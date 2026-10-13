"""
Phase 9: Offset Computer
Reads the raw annotations and auto-computes exact character offsets by searching
for the entity text in the sentence. Run after any annotation changes.
"""
import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

def find_offset(text, entity_text, hint_start=0):
    """Find the character offset of entity_text in text, starting near hint_start."""
    idx = text.find(entity_text, hint_start)
    if idx == -1:
        # Try from beginning
        idx = text.find(entity_text)
    return idx

# Raw annotations with entity texts (no offsets needed - computed below)
# Format: (sentence_id, source_id, text, [(entity_text, label, occurrence_index)], notes, is_zero)
RAW_ANNOTATIONS = [
    ("GOLD_CAND_001","RAG_SCENARIO_4","Dietary diversification helps reduce micronutrient deficiencies such as iron and folate deficiency.",[("iron","NUTRIENT",0),("folate","NUTRIENT",0)],"",False),
    ("GOLD_CAND_002","RAG_GUIDELINE_2","Cereals contribute a large portion of daily energy intake, but over-reliance can reduce micronutrient intake.",[("Cereals","FOOD_GROUP",0)],"energy=general context",False),
    ("GOLD_CAND_003","RAG_G1_2","A healthy meal includes vegetables, whole grains, pulses, fruits, and moderate amounts of fats and sugars.",[("vegetables","FOOD_GROUP",0),("whole grains","FOOD_GROUP",0),("pulses","FOOD_GROUP",0),("fruits","FOOD_GROUP",0),("fats","NUTRIENT",0)],"",False),
    ("GOLD_CAND_004","RAG_G1_3","Vegetables and fruits provide vitamins, minerals, fiber, and antioxidants essential for health.",[("Vegetables","FOOD_GROUP",0),("fruits","FOOD_GROUP",0),("vitamins","NUTRIENT",0),("minerals","NUTRIENT",0),("fiber","NUTRIENT",0)],"",False),
    ("GOLD_CAND_005","RAG_G1_5","Ultra-processed foods high in fat, sugar, and salt should be avoided for better health.",[("Ultra-processed","DIETARY_PROPERTY",0),("fat","NUTRIENT",0),("salt","FOOD",0)],"",False),
    ("GOLD_CAND_006","RAG_G1_8","Pulses and legumes provide important protein and fiber in the diet.",[("Pulses","FOOD_GROUP",0),("legumes","FOOD_GROUP",0),("protein","NUTRIENT",0),("fiber","NUTRIENT",0)],"",False),
    ("GOLD_CAND_007","RAG_G1_10","Limiting added fat, salt, and sugar intake is essential for maintaining good health.",[("fat","NUTRIENT",0),("salt","FOOD",0)],"",False),
    ("GOLD_CAND_008","RAG_G1_13","Macronutrients like carbohydrates, proteins, and fats are needed in large amounts, while micronutrients are required in smaller amounts.",[("carbohydrates","NUTRIENT",0),("proteins","NUTRIENT",0),("fats","NUTRIENT",0)],"",False),
    ("GOLD_CAND_009","RAG_GROUP_2","Different food groups provide essential nutrients such as proteins, vitamins, minerals, and fiber.",[("proteins","NUTRIENT",0),("vitamins","NUTRIENT",0),("minerals","NUTRIENT",0),("fiber","NUTRIENT",0)],"",False),
    ("GOLD_CAND_010","RAG_GROUP_3","Cereals provide a major portion of daily energy intake.",[("Cereals","FOOD_GROUP",0)],"",False),
    ("GOLD_CAND_011","RAG_GROUP_4","Pulses, beans, and meat provide important proteins and essential nutrients.",[("Pulses","FOOD_GROUP",0),("beans","FOOD_GROUP",0),("meat","FOOD_GROUP",0),("proteins","NUTRIENT",0)],"",False),
    ("GOLD_CAND_012","RAG_GROUP_5","Fruits and vegetables provide vitamins, antioxidants, and fiber necessary for health.",[("Fruits","FOOD_GROUP",0),("vegetables","FOOD_GROUP",0),("vitamins","NUTRIENT",0),("fiber","NUTRIENT",0)],"",False),
    ("GOLD_CAND_013","RAG_MACRO_1","A balanced diet should provide 50 to 60 percent of calories from carbohydrates.",[("carbohydrates","NUTRIENT",0)],"",False),
    ("GOLD_CAND_014","RAG_MACRO_2","Proteins should contribute about 10 to 15 percent of total calorie intake.",[("Proteins","NUTRIENT",0)],"",False),
    ("GOLD_CAND_015","RAG_MACRO_3","Fats should contribute about 20 to 30 percent of total calorie intake.",[("Fats","NUTRIENT",0)],"",False),
    ("GOLD_CAND_016","RAG_CARB_1","Carbohydrates are the primary source of energy and should form the largest portion of the diet.",[("Carbohydrates","NUTRIENT",0)],"",False),
    ("GOLD_CAND_017","RAG_PROTEIN_1","Proteins are essential for body structure, growth, and repair.",[("Proteins","NUTRIENT",0)],"",False),
    ("GOLD_CAND_018","RAG_PROTEIN_2","Combining cereals and pulses provides better quality protein due to complementary amino acids.",[("cereals","FOOD_GROUP",0),("pulses","FOOD_GROUP",0),("protein","NUTRIENT",0),("amino acids","NUTRIENT",0)],"",False),
    ("GOLD_CAND_019","RAG_FAT_1","Fats provide concentrated energy and help in absorption of fat-soluble vitamins.",[("Fats","NUTRIENT",0),("fat-soluble vitamins","NUTRIENT",0)],"",False),
    ("GOLD_CAND_020","RAG_MINERAL_1","Minerals such as calcium, iron, and zinc are essential for body functions like bone health, oxygen transport, and immunity.",[("calcium","NUTRIENT",0),("iron","NUTRIENT",0),("zinc","NUTRIENT",0)],"",False),
    ("GOLD_CAND_021","RAG_VITAMIN_1","Fat-soluble vitamins can be stored in the body, while water-soluble vitamins need regular intake.",[("Fat-soluble vitamins","NUTRIENT",0),("water-soluble vitamins","NUTRIENT",0)],"",False),
    ("GOLD_CAND_022","RAG_GUIDE_4","Animal-based foods such as milk, eggs, and meat provide high-quality protein.",[("milk","FOOD",0),("eggs","FOOD",0),("meat","FOOD",0),("protein","NUTRIENT",0)],"",False),
    ("GOLD_CAND_023","RAG_PREG_DIET_4","Fish and meat can be included as sources of high-quality protein and micronutrients.",[("Fish","FOOD_GROUP",0),("meat","FOOD_GROUP",0),("protein","NUTRIENT",0)],"",False),
    ("GOLD_CAND_024","RAG_PREG_DIET_5","Highly processed foods and foods high in sugar, fat, and salt should be avoided during pregnancy.",[("Highly processed","DIETARY_PROPERTY",0),("fat","NUTRIENT",0),("salt","FOOD",0)],"",False),
    ("GOLD_CAND_025","RAG_IRON_1","Iron is essential for hemoglobin synthesis and prevention of anemia.",[("Iron","NUTRIENT",0),("anemia","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_026","RAG_SCENARIO_5","Low intake of diverse foods leads to poor intake of essential fatty acids and micronutrients.",[("essential fatty acids","NUTRIENT",0)],"",False),
    ("GOLD_CAND_027","RAG_G1_9","Nuts and seeds are rich in healthy fats, proteins, and micronutrients.",[("Nuts","FOOD_GROUP",0),("seeds","FOOD_GROUP",0),("fats","NUTRIENT",0),("proteins","NUTRIENT",0)],"",False),
    ("GOLD_CAND_028","RAG_CARB_2","Dietary fiber improves digestion, reduces glucose absorption, and increases satiety.",[("Dietary fiber","NUTRIENT",0)],"",False),
    ("GOLD_CAND_029","RAG_PREG_9","Calcium and vitamin D are essential for bone development of the fetus.",[("Calcium","NUTRIENT",0),("vitamin D","NUTRIENT",0)],"",False),
    ("GOLD_CAND_030","RAG_PREG_DIET_3","Nuts and oilseeds provide essential fatty acids important for fetal development.",[("Nuts","FOOD_GROUP",0),("oilseeds","FOOD_GROUP",0),("essential fatty acids","NUTRIENT",0)],"",False),
    ("GOLD_CAND_031","RAG_DO_1","Vitamin C rich foods improve iron absorption and should be included in the diet.",[("Vitamin C","NUTRIENT",0),("iron","NUTRIENT",0)],"",False),
    ("GOLD_CAND_032","RAG_IRON_2","Vitamin C improves iron absorption from plant-based foods.",[("Vitamin C","NUTRIENT",0),("iron","NUTRIENT",0)],"",False),
    ("GOLD_CAND_033","RAG_FOLATE_1","Folic acid is essential during pregnancy for preventing anemia and supporting fetal development.",[("Folic acid","NUTRIENT",0),("anemia","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_034","RAG_FOLATE_2","Green leafy vegetables, legumes, and nuts are rich sources of folate.",[("Green leafy vegetables","FOOD_GROUP",0),("legumes","FOOD_GROUP",0),("nuts","FOOD_GROUP",0),("folate","NUTRIENT",0)],"",False),
    ("GOLD_CAND_035","RAG_PUFA_1","Omega-3 fatty acids are important for brain development of the fetus.",[("Omega-3 fatty acids","NUTRIENT",0)],"",False),
    ("GOLD_CAND_036","RAG_PUFA_2","Fish and seeds like flax and chia are good sources of omega-3 fatty acids.",[("Fish","FOOD_GROUP",0),("seeds","FOOD_GROUP",0),("flax","FOOD",0),("chia","FOOD",0),("omega-3 fatty acids","NUTRIENT",0)],"",False),
    ("GOLD_CAND_037","RAG_IRON_4","Iron deficiency during pregnancy increases risk of maternal mortality and low birth weight in infants.",[("Iron deficiency","HEALTH_CONDITION",0),("infants","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_038","RAG_IRON_6","Green leafy vegetables, pulses and dry fruits are plant sources of iron.",[("Green leafy vegetables","FOOD_GROUP",0),("pulses","FOOD_GROUP",0),("dry fruits","FOOD_GROUP",0),("iron","NUTRIENT",0)],"",False),
    ("GOLD_CAND_039","RAG_FOLATE_3","Folic acid supplementation during early pregnancy is essential to prevent developmental defects.",[("Folic acid","NUTRIENT",0)],"",False),
    ("GOLD_CAND_040","RAG_PUFA_3","Long-chain omega-3 fatty acids support fetal brain development.",[("Long-chain omega-3 fatty acids","NUTRIENT",0)],"",False),
    ("GOLD_CAND_041","RAG_FULL_2","Vitamin C improves absorption of iron from plant-based foods.",[("Vitamin C","NUTRIENT",0),("iron","NUTRIENT",0)],"",False),
    ("GOLD_CAND_042","RAG_FULL_4","Folic acid is essential during pregnancy for fetal development.",[("Folic acid","NUTRIENT",0)],"",False),
    ("GOLD_CAND_043","RAG_INF_6","Breast milk provides around 500 kcal and 5 grams of protein per day after six months.",[("Breast milk","FOOD",0),("protein","NUTRIENT",0)],"",False),
    ("GOLD_CAND_044","food_breastmilk_002","Breast milk contains Long Chain Polyunsaturated Fatty Acids (LCPUFAs) like DHA and Arachidonic acid for visual and neural development.",[("Breast milk","FOOD",0),("Long Chain Polyunsaturated Fatty Acids","NUTRIENT",0),("DHA","NUTRIENT",0),("Arachidonic acid","NUTRIENT",0)],"",False),
    ("GOLD_CAND_045","food_preterm_milk_001","Preterm milk is nutrient-denser than term milk, containing higher protein, sodium, and IgA to support the baby's needs.",[("Preterm milk","FOOD",0),("nutrient-denser","DIETARY_PROPERTY",0),("milk","FOOD",1),("protein","NUTRIENT",0),("sodium","NUTRIENT",0),("IgA","NUTRIENT",0)],"",False),
    ("GOLD_CAND_046","RAG_INTRO_6","Healthy diets include whole grains, pulses, milk, vegetables, and fruits as key food groups.",[("whole grains","FOOD_GROUP",0),("pulses","FOOD_GROUP",0),("milk","FOOD",0),("vegetables","FOOD_GROUP",0),("fruits","FOOD_GROUP",0)],"",False),
    ("GOLD_CAND_047","RAG_INTRO_7","Cereals and millets are staple foods and are commonly consumed along with pulses in Indian diets.",[("Cereals","FOOD_GROUP",0),("millets","FOOD_GROUP",0),("pulses","FOOD_GROUP",0)],"",False),
    ("GOLD_CAND_048","RAG_GUIDELINE_1","A balanced meal should include cereals, pulses, vegetables, fruits, and milk in appropriate proportions.",[("cereals","FOOD_GROUP",0),("pulses","FOOD_GROUP",0),("vegetables","FOOD_GROUP",0),("fruits","FOOD_GROUP",0),("milk","FOOD",0)],"",False),
    ("GOLD_CAND_049","RAG_G1_6","Healthy eating includes consuming green leafy vegetables and fruits daily.",[("green leafy vegetables","FOOD_GROUP",0),("fruits","FOOD_GROUP",0)],"",False),
    ("GOLD_CAND_050","RAG_GUIDE_2","Combining cereals, pulses, and millets improves overall nutrient quality.",[("cereals","FOOD_GROUP",0),("pulses","FOOD_GROUP",0),("millets","FOOD_GROUP",0)],"",False),
    ("GOLD_CAND_051","RAG_GUIDE_3","Fresh and locally available vegetables should be preferred in daily diet.",[("vegetables","FOOD_GROUP",0)],"",False),
    ("GOLD_CAND_052","RAG_PREG_DIET_1","Pregnant women should consume a variety of foods including cereals, pulses, vegetables, fruits, nuts, and dairy.",[("cereals","FOOD_GROUP",0),("pulses","FOOD_GROUP",0),("vegetables","FOOD_GROUP",0),("fruits","FOOD_GROUP",0),("nuts","FOOD_GROUP",0),("dairy","FOOD_GROUP",0)],"",False),
    ("GOLD_CAND_053","RAG_PREG_DIET_2","Green leafy vegetables and fruits are essential sources of vitamins and minerals during pregnancy.",[("Green leafy vegetables","FOOD_GROUP",0),("fruits","FOOD_GROUP",0),("vitamins","NUTRIENT",0),("minerals","NUTRIENT",0)],"",False),
    ("GOLD_CAND_054","RAG_BF_1","Breast milk is the most complete and natural food for infants.",[("Breast milk","FOOD",0),("infants","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_055","RAG_BF_4","Frequent suckling ensures adequate milk production.",[],""  ,True),
    ("GOLD_CAND_056","RAG_BF_10","Breast milk contains antibodies that protect infants from infections.",[("Breast milk","FOOD",0),("infants","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_057","RAG_BF_12","Alcohol, tobacco, and certain drugs can pass into breast milk and harm the infant.",[("breast milk","FOOD",0),("infant","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_058","RAG_BF_13","Breast milk is easily digested and better absorbed than formula milk.",[("Breast milk","FOOD",0),("formula milk","FOOD",0)],"",False),
    ("GOLD_CAND_059","RAG_BF_14","Breast milk contains immunoglobulins, lactoferrin and protective factors against infections.",[("Breast milk","FOOD",0),("immunoglobulins","NUTRIENT",0),("lactoferrin","NUTRIENT",0)],"",False),
    ("GOLD_CAND_060","RAG_BF_17","Breast milk promotes healthy gut flora due to prebiotic factors.",[("Breast milk","FOOD",0)],"",False),
    ("GOLD_CAND_061","RAG_BF_21","Frequent suckling and complete emptying of one breast ensures adequate milk production.",[],"",True),
    ("GOLD_CAND_062","RAG_BF_22","Inadequate breast milk production is often a misconception and should not lead to stopping breastfeeding.",[("breast milk","FOOD",0),("breastfeeding","FEEDING_METHOD",0)],"",False),
    ("GOLD_CAND_063","RAG_BF_23","Stress and poor emotional health can affect milk production.",[],"",True),
    ("GOLD_CAND_064","RAG_BF_25","Expressed breast milk can be stored in refrigeration for up to 8 hours.",[("breast milk","FOOD",0)],"",False),
    ("GOLD_CAND_065","RAG_BF_26","Medicines, alcohol and drugs can pass into breast milk and harm infants.",[("breast milk","FOOD",0),("infants","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_066","RAG_SCENARIO_1","India faces a dual burden of malnutrition where undernutrition and obesity coexist in the population.",[("malnutrition","HEALTH_CONDITION",0),("undernutrition","HEALTH_CONDITION",0),("obesity","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_067","RAG_SCENARIO_3","High consumption of processed foods rich in sugar, fat, and salt leads to obesity and micronutrient deficiencies.",[("processed foods","DIETARY_PROPERTY",0),("fat","NUTRIENT",0),("salt","FOOD",0),("obesity","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_068","RAG_GUIDELINE_3","Unhealthy dietary patterns can lead to anemia, obesity, and other metabolic disorders.",[("anemia","HEALTH_CONDITION",0),("obesity","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_069","RAG_LIFE_2","Infants require exclusive breastfeeding in the first six months for optimal growth and development.",[("Infants","AGE_GROUP",0),("exclusive breastfeeding","FEEDING_METHOD",0)],"",False),
    ("GOLD_CAND_070","RAG_FAT_2","Excess fat intake can lead to obesity and metabolic disorders.",[("fat","NUTRIENT",0),("obesity","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_071","RAG_MINERAL_2","Iron deficiency can lead to anemia and reduced oxygen transport in the body.",[("Iron deficiency","HEALTH_CONDITION",0),("anemia","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_072","RAG_PREG_1","Pregnancy is a nutritionally demanding period requiring additional food for both mother and fetus.",[],"",True),
    ("GOLD_CAND_073","RAG_PREG_2","Extra nutrients are needed during pregnancy for fetal growth and development.",[],"",True),
    ("GOLD_CAND_074","RAG_PREG_3","Iron, folic acid, vitamin B12, iodine, and omega-3 fatty acids are critical during pregnancy.",[("Iron","NUTRIENT",0),("folic acid","NUTRIENT",0),("vitamin B12","NUTRIENT",0),("iodine","NUTRIENT",0),("omega-3 fatty acids","NUTRIENT",0)],"",False),
    ("GOLD_CAND_075","RAG_PREG_4","Poor nutrition during pregnancy can negatively affect fetal growth and development.",[],"",True),
    ("GOLD_CAND_076","RAG_PREG_5","Undernourished mothers have a higher risk of delivering low birth weight babies.",[("Undernourished","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_077","RAG_PREG_7","A healthy diet during pregnancy improves birth weight and reduces risk of infections in newborns.",[("newborns","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_078","RAG_PREG_8","Folic acid supplementation before and during pregnancy reduces risk of anemia and birth defects.",[("Folic acid","NUTRIENT",0),("anemia","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_079","RAG_PREG_10","Highly processed foods high in fat, sugar, and salt should be avoided during pregnancy.",[("Highly processed","DIETARY_PROPERTY",0),("fat","NUTRIENT",0),("salt","FOOD",0)],"",False),
    ("GOLD_CAND_080","RAG_LACT_1","Lactation increases the need for calories, protein, and micronutrients.",[("protein","NUTRIENT",0)],"",False),
    ("GOLD_CAND_081","RAG_LACT_2","During the first six months of lactation, additional 600 kcal energy is required daily.",[],"",True),
    ("GOLD_CAND_082","RAG_LACT_3","Breastfeeding supports infant growth and reduces health risks.",[("Breastfeeding","FEEDING_METHOD",0),("infant","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_083","RAG_LACT_4","Balanced diets during lactation support optimal milk production.",[],"",True),
    ("GOLD_CAND_084","RAG_PRECON_1","Women should be at least 21 years old and maintain optimal weight before pregnancy.",[],"",True),
    ("GOLD_CAND_085","RAG_PRECON_2","Pre-pregnancy health checks should include anemia, blood pressure, and glucose levels.",[("anemia","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_086","RAG_INF_FULL_12","Lactose intolerance during diarrhea is usually temporary and can be managed by reducing milk intake.",[("Lactose intolerance","HEALTH_CONDITION",0),("diarrhea","HEALTH_CONDITION",0),("milk","FOOD",0)],"",False),
    ("GOLD_CAND_087","RAG_INF_FULL_13","Curd can be used as an alternative to milk in lactose intolerance.",[("Curd","FOOD",0),("milk","FOOD",0),("lactose intolerance","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_088","rag_food_allergy_cross_reactivity_001","Soya-Milk Cross Reactivity: Soya protein allergy often develops as a cross-reacting response in infants with cow's milk allergy.",[("Soya protein allergy","ALLERGEN",0),("infants","AGE_GROUP",0),("cow's milk allergy","ALLERGEN",0)],"",False),
    ("GOLD_CAND_089","RAG_NUT_CALC_03","Serving ragi as malted ragi porridge, ragi idlis, ragi dosas, or ragi rotis provides an outstanding plant-based calcium source for lactose-intolerant, vegan, or vegetarian children.",[("ragi","FOOD",0),("malted ragi porridge","FOOD",0),("ragi idlis","FOOD",0),("ragi dosas","FOOD",0),("ragi rotis","FOOD",0),("calcium","NUTRIENT",0),("lactose-intolerant","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_090","RAG_ALG_CMPA_01","Cow's Milk Protein Allergy (CMPA) is an immunologically mediated adverse reaction to bovine milk proteins (primarily casein fractions alpha-s1, alpha-s2, beta, kappa-casein and whey proteins beta-lactoglobulin and alpha-lactalbumin).",[("Cow's Milk Protein Allergy","ALLERGEN",0)],"",False),
    ("GOLD_CAND_091","RAG_ALG_CMPA_01","It can be IgE-mediated (immediate urticaria, angioedema, wheezing, anaphylaxis) or non-IgE-mediated (delayed proctocolitis with bloody stools, vomiting, severe eczema, failure to thrive).",[("urticaria","HEALTH_CONDITION",0),("angioedema","HEALTH_CONDITION",0),("wheezing","HEALTH_CONDITION",0),("anaphylaxis","HEALTH_CONDITION",0),("proctocolitis","HEALTH_CONDITION",0),("vomiting","HEALTH_CONDITION",0),("severe eczema","HEALTH_CONDITION",0),("failure to thrive","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_092","RAG_ALG_CMPA_02","Cow's Milk Protein Allergy is distinct from Lactose Intolerance.",[("Cow's Milk Protein Allergy","ALLERGEN",0),("Lactose Intolerance","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_093","RAG_ALG_CMPA_02","Lactose intolerance is a non-immune enzyme deficiency (reduced intestinal mucosal lactase activity) causing osmotic diarrhea, abdominal bloating, and flatulence without systemic allergic manifestations.",[("Lactose intolerance","HEALTH_CONDITION",0),("osmotic diarrhea","HEALTH_CONDITION",0),("abdominal bloating","HEALTH_CONDITION",0),("flatulence","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_094","RAG_ALG_CMPA_02","CMPA requires complete elimination of milk proteins, whereas lactose intolerance allows dairy proteins with lactase enzyme replacement or fermented low-lactose dairy.",[("CMPA","ALLERGEN",0),("lactose intolerance","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_095","RAG_ALG_CMPA_03","In managing diagnosed Cow's Milk Protein Allergy in non-breastfed infants, standard mammalian milks (including goat's milk and buffalo's milk) are contraindicated due to high cross-reactivity (>90%).",[("Cow's Milk Protein Allergy","ALLERGEN",0),("infants","AGE_GROUP",0),("goat's milk","FOOD",0),("buffalo's milk","FOOD",0)],"",False),
    ("GOLD_CAND_096","RAG_ALG_CMPA_04","For older children with confirmed CMPA transitioning to family diets, alternative non-dairy calcium and protein sources must be systematically incorporated.",[("CMPA","ALLERGEN",0),("calcium","NUTRIENT",0),("protein","NUTRIENT",0)],"",False),
    ("GOLD_CAND_097","RAG_ALG_LACT_01","Lactose intolerance in children commonly occurs as a transient secondary lactase deficiency following acute viral gastroenteritis (such as rotavirus infection), where mucosal brush border enterocytes are temporarily denuded.",[("Lactose intolerance","HEALTH_CONDITION",0),("secondary lactase deficiency","HEALTH_CONDITION",0),("acute viral gastroenteritis","HEALTH_CONDITION",0)],"",False),
    ("GOLD_CAND_098","RAG_ALG_LACT_01","Managing secondary lactose intolerance involves continuing breastfeeding, offering curd (which contains endogenous bacterial beta-galactosidase), or temporary low-lactose feeding during mucosal recovery.",[("lactose intolerance","HEALTH_CONDITION",0),("breastfeeding","FEEDING_METHOD",0),("curd","FOOD",0)],"",False),
    ("GOLD_CAND_099","RAG_ALG_EGG_01","Egg allergy is one of the most common pediatric IgE-mediated food allergies, primarily driven by egg white proteins: ovomucoid (Gal d 1, heat-stable), ovalbumin (Gal d 2, heat-labile), ovotransferrin (Gal d 3), and lysozyme (Gal d 4).",[("Egg allergy","ALLERGEN",0)],"",False),
    ("GOLD_CAND_100","RAG_ALG_EGG_02","Many children with egg allergy can safely tolerate extensively baked egg matrices (such as in thoroughly baked muffins or cakes), where high temperatures and wheat matrix interaction denature heat-labile ovalbumin proteins.",[("children","AGE_GROUP",0),("egg allergy","ALLERGEN",0),("egg","FOOD",1),("muffins","FOOD",0),("cakes","FOOD",0)],"",False),
    ("GOLD_CAND_101","RAG_INTRO_2","Nutrition during early life, especially the first 1000 days, plays a critical role in growth and development.",[("first 1000 days","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_102","RAG_LIFE_3","Children need nutrient-rich foods for growth, brain development, and cognition.",[("Children","AGE_GROUP",0),("nutrient-rich","DIETARY_PROPERTY",0)],"",False),
    ("GOLD_CAND_103","RAG_LIFE_4","Adolescents require proper nutrition for growth spurts and bone development.",[("Adolescents","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_104","RAG_PREG_6","The first 1000 days from conception to two years of age are critical for child development.",[("first 1000 days","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_105","RAG_BF_2","Exclusive breastfeeding for the first six months ensures optimal infant growth.",[("Exclusive breastfeeding","FEEDING_METHOD",0),("infant","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_106","RAG_BF_5","Breastfeeding reduces infections and improves immunity in infants.",[("Breastfeeding","FEEDING_METHOD",0),("infants","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_107","RAG_BF_11","Not breastfeeding increases risk of infections and chronic diseases in children.",[("breastfeeding","FEEDING_METHOD",0),("children","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_108","RAG_BF_15","Breastfeeding reduces risk of respiratory and diarrheal infections in infants.",[("Breastfeeding","FEEDING_METHOD",0),("infants","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_109","RAG_BF_16","Breastfeeding supports cognitive and brain development in children.",[("Breastfeeding","FEEDING_METHOD",0),("children","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_110","RAG_RISK_1","Not breastfeeding increases risk of obesity, diabetes and infections in children.",[("breastfeeding","FEEDING_METHOD",0),("obesity","HEALTH_CONDITION",0),("diabetes","HEALTH_CONDITION",0),("children","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_111","RAG_FULL_5","Exclusive breastfeeding for six months is essential for infant growth.",[("Exclusive breastfeeding","FEEDING_METHOD",0),("infant","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_112","RAG_FULL_7","Breastfeeding reduces the risk of obesity, diabetes and infections in children.",[("Breastfeeding","FEEDING_METHOD",0),("obesity","HEALTH_CONDITION",0),("diabetes","HEALTH_CONDITION",0),("children","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_113","RAG_FULL_9","Alcohol, tobacco and certain medicines can harm infants through breast milk.",[("infants","AGE_GROUP",0),("breast milk","FOOD",0)],"",False),
    ("GOLD_CAND_114","RAG_INF_1","Infants aged 6 to 8 months should be given complementary foods at least twice a day along with breastfeeding.",[("Infants aged 6 to 8 months","AGE_GROUP",0),("complementary foods","FEEDING_METHOD",0),("breastfeeding","FEEDING_METHOD",0)],"",False),
    ("GOLD_CAND_115","RAG_INF_2","Infants aged 9 to 12 months should receive complementary foods at least three times a day.",[("Infants aged 9 to 12 months","AGE_GROUP",0),("complementary foods","FEEDING_METHOD",0)],"",False),
    ("GOLD_CAND_116","rag_home_feeding_discharged_001","High energy snacks between meals.",[("snacks","MEAL_TYPE",0),("meals","MEAL_TYPE",0)],"",False),
    ("GOLD_CAND_117","rag_breakfast_brain_food_001","Breakfast is Brain Food: Missing breakfast significantly affects classroom performance and cognitive function in adolescents due to prolonged overnight fasting.",[("Breakfast","MEAL_TYPE",0),("breakfast","MEAL_TYPE",0),("adolescents","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_118","RAG_FDN_006","Common causes of poor dietary diversity among Indian children include excessive reliance on energy-dense commercial packaged snacks, early introduction of ultra-processed sugary drinks, parental time constraints, and toddler food neophobia.",[("children","AGE_GROUP",0),("energy-dense","DIETARY_PROPERTY",0),("snacks","MEAL_TYPE",0),("ultra-processed","DIETARY_PROPERTY",0),("toddler","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_119","RAG_FDN_016","Establishing a predictable daily feeding rhythm comprising 3 small main meals and 2 to 3 nutrient-dense snacks spaced every 2.",[("meals","MEAL_TYPE",0),("nutrient-dense","DIETARY_PROPERTY",0),("snacks","MEAL_TYPE",0)],"",False),
    ("GOLD_CAND_120","RAG_FDN_019","Avoiding hyper-sweetened commercial infant cereals and packaged snacks prevents early habituation to extreme sweetness that can cause vegetable rejection later in childhood.",[("infant","AGE_GROUP",0),("cereals","FOOD_GROUP",0),("snacks","MEAL_TYPE",0),("childhood","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_121","RAG_AGE_9_11M_02","For infants aged 9 to 11 months, complementary feeding frequency should increase to 3 to 4 meals daily, plus 1 to 2 nutritious snacks offered between meals as desired, while continuing regular breastfeeding.",[("infants aged 9 to 11 months","AGE_GROUP",0),("complementary feeding","FEEDING_METHOD",0),("meals","MEAL_TYPE",0),("snacks","MEAL_TYPE",0),("meals","MEAL_TYPE",1),("breastfeeding","FEEDING_METHOD",0)],"",False),
    ("GOLD_CAND_122","RAG_AGE_9_11M_08","Iron-rich snacks for older infants aged 9 to 11 months can be prepared from traditional Indian staples: soft-cooked poha with mashed peas, sprouted ragi sheera prepared with water or expressed milk and mashed dates, and steamed sweet potato sticks lightly sprinkled with cumin powder.",[("Iron","NUTRIENT",0),("snacks","MEAL_TYPE",0),("infants aged 9 to 11 months","AGE_GROUP",0),("poha","FOOD",0),("peas","FOOD",0),("ragi sheera","FOOD",0),("milk","FOOD",0),("dates","FOOD",0),("sweet potato","FOOD",0),("cumin powder","FOOD",0)],"",False),
    ("GOLD_CAND_123","RAG_AGE_1_2Y_02","A balanced daily meal structure comprises 3 main family meals and 2 nutritious snacks.",[("meals","MEAL_TYPE",0),("snacks","MEAL_TYPE",0)],"",False),
    ("GOLD_CAND_124","RAG_AGE_1_2Y_04","Nutrient-dense snacks for 1 to 2 year old toddlers should bridge energetic gaps between main meals without filling the stomach with empty calories.",[("Nutrient-dense","DIETARY_PROPERTY",0),("snacks","MEAL_TYPE",0),("toddlers","AGE_GROUP",0),("meals","MEAL_TYPE",0)],"",False),
    ("GOLD_CAND_125","RAG_AGE_1_2Y_04","Excellent Indian toddler snacks include soft ragi-halwa prepared with pure cow's ghee and mashed banana, soft paneer cubes, vegetable upma, boiled sweet potato mash, and fresh soft papaya cubes.",[("toddler","AGE_GROUP",0),("snacks","MEAL_TYPE",0),("ragi-halwa","FOOD",0),("cow's ghee","FOOD",0),("banana","FOOD",0),("paneer","FOOD",0),("vegetable upma","FOOD",0),("sweet potato","FOOD",0),("papaya","FOOD",0)],"",False),
    ("GOLD_CAND_126","RAG_AGE_2_5Y_08","Mid-afternoon snack planning for preschoolers should bridge energetic gaps after active preschool hours.",[("Mid-afternoon snack","MEAL_TYPE",0),("preschoolers","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_127","RAG_AGE_2_5Y_08","Wholesome Indian snack options include roasted makhana (fox nuts), boiled sweet corn with lemon juice, steamed vegetable idlis with mild coconut chutney, and fresh seasonal fruit slices.",[("snack","MEAL_TYPE",0),("roasted makhana","FOOD",0),("sweet corn","FOOD",0),("vegetable idlis","FOOD",0),("coconut chutney","FOOD",0),("fresh seasonal fruit","FOOD_GROUP",0)],"",False),
    ("GOLD_CAND_128","RAG_AGE_5_9Y_01","A wholesome breakfast combining complex carbohydrates and protein\u2014such as vegetable upma with boiled egg, or stuffed paneer paratha with homemade curd\u2014improves morning alertness, memory retention, and academic performance.",[("breakfast","MEAL_TYPE",0),("carbohydrates","NUTRIENT",0),("protein","NUTRIENT",0),("vegetable upma","FOOD",0),("egg","FOOD",0),("paneer paratha","FOOD",0),("curd","FOOD",0)],"",False),
    ("GOLD_CAND_129","RAG_AGE_5_9Y_05","Nutritious snack choices include roasted makhana (fox nuts), boiled sweet corn with lemon and chaat masala, seasonal fruit chaat with pomegranate and guava, and a glass of plain lassi or warm turmeric milk.",[("snack","MEAL_TYPE",0),("roasted makhana","FOOD",0),("sweet corn","FOOD",0),("fruit chaat","FOOD",0),("pomegranate","FOOD",0),("guava","FOOD",0),("lassi","FOOD",0),("turmeric milk","FOOD",0)],"",False),
    ("GOLD_CAND_130","RAG_AGE_5_9Y_06","Involving children in grocery shopping, label reading, and simple kitchen tasks fosters nutrition literacy and helps them make healthier choices when encountering commercial snack promotions.",[("children","AGE_GROUP",0),("snack","MEAL_TYPE",0)],"",False),
    ("GOLD_CAND_131","condition_preterm_002","Preterm infants have higher growth velocity than term babies but start with very little nutrient stores.",[("infants","AGE_GROUP",0),("growth velocity","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_132","rag_growth_chart_001","The growth chart or 'Road to Health' was popularized by David Morley for growth monitoring.",[],"",True),
    ("GOLD_CAND_133","rag_malnutrition_anthropometry_001","Mid Arm Circumference (MAC): <12.",[("Mid Arm Circumference","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_134","rag_obesity_epidemic_001","Type 2 diabetes risk increases 10-fold once BMI exceeds 30 kg/m2.",[("Type 2 diabetes","HEALTH_CONDITION",0),("BMI","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_135","rag_geriatric_bmi_guideline_001","Geriatric BMI Targets: Normal weight status for the elderly is recommended as BMI 21 to 27.",[("BMI","GROWTH_METRIC",0),("BMI","GROWTH_METRIC",1)],"",False),
    ("GOLD_CAND_136","rag_the_development_paradox_001","The Development Paradox: India accounts for 30% of the global child death burden despite a 7% economic growth rate.",[("child","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_137","rag_adiposity_rebound_timing_001","Adiposity Rebound: The second rise in BMI curve.",[("BMI","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_138","rag_adult_bmi_classification_001","Adult BMI Classification: Underweight (<18.",[("BMI","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_139","rag_iotf_logic_child_bmi_001","IOTF Cut-offs: Age-specific child BMI values (males/females) defined to converge at the adult benchmarks of 25 (overweight) and 30 (obese) at age 18.",[("child BMI","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_140","RAG_FDN_014","Pediatric energy requirements fluctuate dynamically based on chronological age, gender, basal metabolic rate (BMR), growth velocity, and daily physical activity levels.",[("Pediatric","AGE_GROUP",0),("growth velocity","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_141","RAG_AGE_1_2Y_01","During toddlerhood (1 to 2 years of age), linear growth velocity naturally decelerates compared to the rapid growth of infancy.",[("toddlerhood","AGE_GROUP",0),("linear growth velocity","GROWTH_METRIC",0),("infancy","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_142","RAG_AGE_9_12Y_01","Preadolescence (ages 9 to 12 years) is characterized by accelerated linear growth velocity, increasing skeletal muscle mass in boys, physiological adipose redistribution in girls, and hormonal preparation for puberty.",[("Preadolescence","AGE_GROUP",0),("accelerated linear growth velocity","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_143","RAG_NUT_ZINC_06","Roasting and finely powdering these seeds allows parents to blend them seamlessly into toddler porridges, atta dough for rotis, or warm milk, delivering bioavailable zinc to support linear height velocity.",[("toddler","AGE_GROUP",0),("milk","FOOD",0),("zinc","NUTRIENT",0),("linear height velocity","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_144","RAG_GRW_MON_04","Evaluating longitudinal growth trajectories and growth velocity across multiple sequential time points is far more clinically informative than any single measurement.",[("growth trajectories","GROWTH_METRIC",0),("growth velocity","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_145","RAG_GRW_MON_05","Growth velocity refers to the rate of physical growth over a specified time interval, typically expressed as centimeters per year for height or grams per month for weight.",[("Growth velocity","GROWTH_METRIC",0),("height","GROWTH_METRIC",0),("weight","GROWTH_METRIC",0)],"",False),
    ("GOLD_CAND_146","RAG_G1_15","Low food intake during critical life stages like childhood can negatively impact growth and development.",[("childhood","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_147","RAG_BF_20","Water, honey, glucose or formula should not be given during the first six months.",[("honey","FOOD",0),("formula","FOOD",0)],"",False),
    ("GOLD_CAND_148","RAG_INF_10","Sugar and salt should not be added to complementary foods for infants.",[("salt","FOOD",0),("complementary foods","FEEDING_METHOD",0),("infants","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_149","RAG_RULE_1","Sugar and salt should not be added to infant foods.",[("salt","FOOD",0),("infant","AGE_GROUP",0)],"",False),
    ("GOLD_CAND_150","RAG2005","Salt and sugar should be avoided in infant food preparation.",[("Salt","FOOD",0),("infant","AGE_GROUP",0)],"",False),
]

ANNOTATOR = "domain_expert_v1"

def find_nth(text, sub, n):
    """Find the nth occurrence (0-indexed) of sub in text."""
    idx = -1
    for _ in range(n + 1):
        idx = text.find(sub, idx + 1)
        if idx == -1:
            return -1
    return idx

def build_records(raw):
    records = []
    errors = []
    for row in raw:
        sid, src, text, ent_specs, notes, is_zero = row
        entities = []
        for spec in ent_specs:
            ent_text, label, occ = spec
            idx = find_nth(text, ent_text, occ)
            if idx == -1:
                errors.append(f"[{sid}] Could not find '{ent_text}' (occ={occ}) in: {text[:60]}")
                continue
            entities.append({
                "start": idx,
                "end": idx + len(ent_text),
                "text": ent_text,
                "label": label
            })
        rec = {
            "sentence_id": sid,
            "source_id": src,
            "text": text,
            "entities": entities,
            "annotator": ANNOTATOR,
            "notes": notes
        }
        if is_zero:
            rec["is_zero_entity_verified"] = True
        records.append(rec)
    return records, errors

records, errors = build_records(RAW_ANNOTATIONS)

if errors:
    print(f"BUILD ERRORS ({len(errors)}):")
    for e in errors:
        print(f"  {e}")
else:
    # Verify all spans
    span_errors = []
    for r in records:
        for ent in r['entities']:
            actual = r['text'][ent['start']:ent['end']]
            if actual != ent['text']:
                span_errors.append(f"[{r['sentence_id']}] Mismatch: expected '{ent['text']}' got '{actual}'")
    if span_errors:
        print(f"SPAN VERIFICATION ERRORS ({len(span_errors)}):")
        for e in span_errors:
            print(f"  {e}")
    else:
        out_path = 'ner/data/human_gold/human_gold.jsonl'
        with open(out_path, 'w', encoding='utf-8') as f:
            for r in records:
                f.write(json.dumps(r, ensure_ascii=False) + '\n')
        total_ents = sum(len(r['entities']) for r in records)
        zero_sents = sum(1 for r in records if len(r['entities']) == 0)
        print(f"SUCCESS: Written {len(records)} records with {total_ents} entities to {out_path}")
        print(f"  Sentences with entities: {len(records) - zero_sents}")
        print(f"  Empty sentences (verified): {zero_sents}")
