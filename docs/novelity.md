# NutriKids: Features, Metrics, Algorithms, and Novelty

## 🌟 Novelty
NutriKids is a clinical-grade pediatric nutrition intelligence platform that uniquely bridges the communication and data gaps between parents, children, and pediatricians. Its core novelties include:
- **Hybrid Medical-Grade RAG Engine**: Grounded strictly in pediatric guidelines (ICMR and NIN) rather than generic LLM knowledge, ensuring clinical accuracy.
- **Privacy-First Offline Mode**: A parent-controlled toggle that reroutes all AI queries to a local, on-device LLM (Ollama running Llama3/Mistral), ensuring sensitive pediatric data never leaves the device.
- **Deterministic Allergen Shielding**: A pre-processing filter that entirely excludes restricted allergens from AI context, ensuring absolute nutritional safety.
- **Two-Tier Clinical Handshake**: A secure authorization protocol allowing parents to grant restricted or full access of their child's dietary and growth data to pediatricians.
- **Gamified Kids Mode (Food Buddy)**: Transforms static logging into an interactive experience for children, using a mascot to encourage healthy eating habits while strictly refusing clinical queries.

## ✨ Key Features
1. **Authentication & RBAC**: Secure, role-based access for Parents, Doctors, and Children using stateless JWT tokens.
2. **Child Profile Management**: Multi-child tracking under a single parent account with medical and demographic records.
3. **Meal & Water Logging**: Detailed daily logging across multiple meal slots, supported by an extensive 115+ Indian Foods database.
4. **Nutrition Gap Analysis**: Visual dashboards highlighting macro and micro dietary gaps based on WHO/ICMR standards.
5. **AI Nutrition Assistant (NutriGuide)**: Conversational pediatric advisor for parents with citations and strict safety guardrails.
6. **Doctor Portal**: Specialist oversight panel featuring growth velocity charts, patient history, and clinical alert escalations.
7. **Growth Tracking**: Longitudinal tracking of height, weight, and automated BMI calculation with risk categorization.
8. **Escalation System**: An automated triage system that flags high-risk clinical symptoms detected in chat to the connected pediatrician.

## 📊 Performance Metrics
The system is designed with strict performance and latency objectives to ensure a seamless experience:
- **Transactional Route Latency**: $< 200\text{ms}$ for standard API operations.
- **Profile CRUD Latency**: $< 150\text{ms}$.
- **Severity Categorization Latency**: $< 15\text{ms}$ for pediatric symptom triage and escalation routing.
- **AI RAG Generation Latency**: $< 1.5\text{s}$ average response time for cloud generation (Gemini 2.5 Flash).
- **RAG Retrieval Accuracy**: Mean Reciprocal Rank (MRR) $> 0.85$ on clinical benchmark tests.
- **Safety Compliance**: 100% deterministic blocking of allergens and 100% cloud-bypass when Privacy Mode is active.

## 🧮 Algorithms & Architecture
NutriKids employs a sophisticated multi-stage AI and retrieval architecture:
1. **Hybrid Retrieval-Augmented Generation (RAG)**:
   - **BM25 Lexical Matching**: Captures exact keyword matches for specific Indian dishes or clinical terms.
   - **FAISS Dense Vector Matching**: Performs semantic similarity search over guidelines using lightweight embeddings (`all-MiniLM-L6-v2` or `e5-small-v2`).
2. **Context Reranking**:
   - **Reciprocal Rank Fusion (RRF)**: Merges the lexical and semantic retrieval results.
   - **Cross-Encoder**: Uses `ms-marco-MiniLM-L-6-v2` to rerank and filter the context to the top most relevant chunks, significantly reducing prompt token size.
3. **Adaptive Model Routing**:
   - Primary: Routes to **Google Gemini 2.5 Flash** for high-speed, structured generation.
   - Fallback/Privacy: Diverts to **Local Ollama (Llama3/Mistral)** when Privacy Mode is on or the cloud API is unavailable.
   - Offline Safe: Fails safe to a deterministic rule-based specialist if all LLMs are unreachable.
4. **Growth Diagnostics**: Auto-calculates BMI ($Weight / Height^2$) and maps it against WHO pediatric percentile categorizations to flag underweight or obese risk statuses.

