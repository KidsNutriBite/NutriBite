import faiss
import pickle
import numpy as np
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from huggingface_hub import InferenceClient

# Global variables for models and data
embedder = None
index = None
documents = None
hf_client = None
gemini_client = None

# =============================
# Lifespan Manager
# =============================
@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedder, index, documents, hf_client, gemini_client
    
    # 1. Load FAISS Index + Docs (First, to check dimension)
    index_dim = 384 # Default to small model dimension
    
    if os.path.exists("faiss_textbooks.index") and os.path.exists("rag_docs_textbooks_only.pkl"):
        print("Loading FAISS index and documents...")
        try:
            index = faiss.read_index("faiss_textbooks.index")
            with open("rag_docs_textbooks_only.pkl", "rb") as f:
                documents = pickle.load(f)
            
            # Detect dimension from index
            index_dim = index.d
            print(f"Detected FAISS index dimension: {index_dim}")
            
        except Exception as e:
            print(f"Error loading RAG data: {e}")
    else:
        print("\n" + "="*50)
        print("WARNING: 'faiss_textbooks.index' or 'rag_docs_textbooks_only.pkl' not found.")
        print("The API will run in MOCK mode (returning placeholder responses).")
        print("Please ensure these files are in the current directory.")
        print("="*50 + "\n")

    # 2. Load Embedding Model based on detected dimension
    print(f"Loading embedding model for dimension {index_dim}...")
    try:
        if index_dim == 384:
            # Small model
            embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        elif index_dim == 1024:
            # Large model (warning: slow download)
            print("Required model: BAAI/bge-large-en-v1.5 (1.34GB)")
            embedder = SentenceTransformer("BAAI/bge-large-en-v1.5")
        else:
            print(f"Warning: Unknown index dimension {index_dim}. Defaulting to all-MiniLM-L6-v2.")
            embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            
    except Exception as e:
        print(f"Warning: Failed to load embedding model: {e}")

    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Initialize Hugging Face LLM Client
    hf_token = os.getenv("HF_TOKEN")
    if not hf_token:
        print("Warning: HF_TOKEN environment variable not set. HF LLM features may not work.")
    
    hf_client = InferenceClient(
        model="HuggingFaceH4/zephyr-7b-beta",
        token=hf_token
    )

    # Initialize Gemini LLM Client Pipeline 
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if gemini_api_key:
        try:
            from google import genai
            gemini_client = genai.Client(api_key=gemini_api_key)
            print("Gemini API Client initialized successfully.")
        except ImportError:
            print("google-genai library is not installed. Gemini fallback will be unavailable.")
    else:
        print("Warning: GEMINI_API_KEY environment variable not set. Gemini fallback will not be available.")

    yield
    
    # Clean up resources if needed
    print("Shutting down...")

# =============================
# FastAPI App
# =============================
app = FastAPI(lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    question: str
    history: list[Message] = []
    age: str = "5 years"
    weight: str = "Unknown"
    conditions: str = "None"
    prescription: str = "None"
    audience: str = "parent"

class MealLog(BaseModel):
    name: str
    portion: str = "1 serving"

class NutritionAnalysisRequest(BaseModel):
    age: int
    gender: str = "neutral"
    meals: list[MealLog]


def retrieve_context(query, k=4):
    if index is None or documents is None or embedder is None:
        return "No context available (Index/Documents not loaded)."
        
    query_embedding = embedder.encode([query])
    distances, indices = index.search(np.array(query_embedding), k)
    
    # Retrieve documents based on indices
    retrieved_docs = []
    print(f"Retrieved indices: {indices[0]}") # Debugging
    
    for i in indices[0]:
        doc = documents[i]
        # Handle if doc is a dictionary (common in LangChain/RAG)
        if isinstance(doc, dict):
            # Try common keys for text content
            content = doc.get('page_content') or doc.get('text') or doc.get('content') or str(doc)
            retrieved_docs.append(content)
        # Handle if doc is an object (e.g. LangChain Document)
        elif hasattr(doc, 'page_content'):
             retrieved_docs.append(doc.page_content)
        # Handle if doc is already a string
        elif isinstance(doc, str):
            retrieved_docs.append(doc)
        else:
            retrieved_docs.append(str(doc))

    return "\n".join(retrieved_docs)

def generate_answer(query, history, profile):
    context = retrieve_context(query)

    # If running in mock mode because files are missing
    if index is None or documents is None:
        return ("(Mock Response) System is running in safe mode because RAG files are missing. "
                "Please place 'faiss_textbooks.index' and 'rag_docs_textbooks_only.pkl' in the project folder.")

    if profile.get("audience") == "kid":
         prompt = f"""
You are Food Buddy, a fun and friendly nutrition companion for kids! 🥦🦁

RULES:
- Start with a fun greeting!
- Use a storyteller voice.
- If asked for a story, make up a short, fun adventure about food heroes!
- Use simple words and lots of emojis.
- Explain things using superheroes (e.g., "Carrots give you X-ray vision like a hero!").
- Do NOT give medical advice.
- If asked about medicine, say "Ask a grown-up!".
- Structure your answer nicely using bullet points and short paragraphs.

Information about the kid:
Age: {profile["age"]}

Question: {query}

Context:
{context}

Answer like a best friend:
"""
    else:
        prompt = f"""
You are NutriGuide AI, an advanced pediatric nutrition assistant.

STRICT INSTRUCTIONS:
1. If the user's question involves a symptom (e.g., fever, stomach ache) and lacks crucial context (e.g., how many days they've had it, severity, other symptoms), you MUST ask 1-2 brief follow-up questions to gather more information BEFORE giving a detailed answer.
2. If you have enough context, first provide a **Direct, Short Answer** (2-3 sentences max) with practical and immediate advice.
3. Then, output exactly this separator: |||DETAILED|||
4. After the separator, provide a **Detailed Explanation**. Use Markdown formatting (### for headers, - for bullets, **bold** for key terms). Explain *why* and give specific examples.
5. Do NOT output |||DETAILED||| if you are just asking a clarifying question.

Profile:
Age: {profile["age"]}
Weight: {profile["weight"]}
Conditions: {profile["conditions"]}
Prescriptions: {profile["prescription"]}

Context:
{context}

Format if answering:
[Short Answer]
|||DETAILED|||
[Detailed Markdown Explanation]

Format if asking clarifying question:
[Just ask the question naturally and empathetically]
"""

    # Build messages array including history
    formatted_messages = []
    for msg in history:
        # Convert "model" to "assistant" for HF, or keep as is.
        # Gemini uses 'user' and 'model'. HF uses 'user' and 'assistant'.
        hf_role = "assistant" if msg.role == "model" or msg.role == "assistant" else "user"
        formatted_messages.append({"role": hf_role, "content": msg.content})
    
    # Add the final system prompt + query
    # We pass the system context as part of the new user prompt since some APIs don't strictly support system roles
    final_query = f"{prompt}\n\nQuestion: {query}"
    formatted_messages.append({"role": "user", "content": final_query})

    try:
        if hf_client:
            response = hf_client.chat_completion(
                messages=formatted_messages,
                max_tokens=600,
                temperature=0.3
            )
            return response.choices[0].message.content
        raise Exception("HF Client not properly defined.")
    except Exception as e:
        print(f"HuggingFace Failed in `generate_answer`: {e}. Attempting fallback to Gemini...")
        if gemini_client:
            try:
                # Gemini expects history format: [{"role": "user", "parts": ["..."]}, {"role": "model", "parts": ["..."]}]
                # Note: google-genai structured differently. We will use the client.models.generate_content API
                # passing a list of contents.
                gemini_contents = []
                for msg in history:
                    # gemini role is either 'user' or 'model'
                    g_role = "model" if msg.role == "assistant" or msg.role == "model" else "user"
                    gemini_contents.append({"role": g_role, "parts": [{"text": msg.content}]})
                
                gemini_contents.append({"role": "user", "parts": [{"text": final_query}]})
                
                response = gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=gemini_contents,
                )
                return response.text
            except Exception as gemini_e:
                 print(f"Gemini Fallback also failed: {gemini_e}")
                 return f"Error: Both HuggingFace and Gemini models failed to generate response."
        else:
            return f"Error generating response: HF Failed and Gemini Fallback not available ({e})"

@app.post("/ask")
async def ask_ai(request: QueryRequest):
    profile = {
        "age": request.age,
        "weight": request.weight,
        "conditions": request.conditions,
        "prescription": request.prescription,
        "audience": request.audience
    }

    answer = generate_answer(request.question, request.history, profile)

    return {"answer": answer}

@app.post("/analyze")
async def analyze_nutrition(request: NutritionAnalysisRequest):
    # 1. Construct prompt for LLM to analyze nutrition
    meal_descriptions = ", ".join([f"{m.name} ({m.portion})" for m in request.meals])
    
    prompt = f"""
You are a Clinical Pediatric Nutritionist AI. 
Explain the micronutrient gaps based on the child's intake today vs Recommended Dietary Allowance (RDA) for a {request.age} year old.

Intake Today: {meal_descriptions}

Task:
1. Estimate the micronutrient content (Iron, Calcium, Vit A, Vit C, Vit D, Zinc, Magnesium).
2. Compare against RDA for age {request.age}.
3. Identify SUBSTANTIAL deficiencies (Gaps).
4. For each gap, suggest 1 specific food to add.

Format the output strictly as JSON:
```json
{{
  "analysis_summary": "Short clinical summary (max 2 sentences).",
  "deficiencies": [
    {{
      "nutrient": "Iron",
      "status": "Low" | "Very Low",
      "current_estimated": "3mg",
      "target": "10mg",
      "suggestion": "Add spinach or lentils"
    }}
  ],
  "score": 85
}}
```
Do not include any text outside the JSON block.
"""

    try:
        if hf_client:
             response = hf_client.chat_completion(
                 messages=[{"role": "user", "content": prompt}],
                 max_tokens=600,
                 temperature=0.2
             )
             content = response.choices[0].message.content
        else:
             raise Exception("HF Client not properly defined")
        
    except Exception as e:
        print(f"HF Error analyzing nutrition: {e}. Falling back to Gemini...")
        if gemini_client:
            try:
                response = gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                )
                content = response.text
            except Exception as gemini_e:
                 print(f"Gemini fallback error analyzing nutrition: {gemini_e}")
                 return perform_rule_based_analysis(request.meals, request.age)
        else:
             print("No Gemini Client available. Using rule-based fallback...")
             return perform_rule_based_analysis(request.meals, request.age)

    # Extract JSON from potential markdown code blocks
    import json
    import re
    
    json_match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        # Try to find just braces if no code block
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        json_str = json_match.group(0) if json_match else "{}"
        
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        print(f"Failed to decode JSON from model output. Falling back...")
        return perform_rule_based_analysis(request.meals, request.age)

def perform_rule_based_analysis(meals, age):
    """Fallback analysis when LLM is unavailable."""
    meal_names = " ".join([m.name.lower() for m in meals])
    gaps = []
    
    # 1. Iron Check (Spinach, lentils, meat, dates, pomegranate)
    if not any(x in meal_names for x in ['palak', 'spinach', 'lentil', 'dal', 'meat', 'chicken', 'fish', 'egg', 'poha', 'dates', 'pomegranate']):
        gaps.append({
            "nutrient": "Iron",
            "status": "Low",
            "current_estimated": "Low",
            "target": "10mg",
            "suggestion": "Add spinach, dal, or eggs"
        })

    # 2. Calcium Check (Milk, curd, yogurt, cheese, paneer, ragi)
    if not any(x in meal_names for x in ['milk', 'curd', 'yogurt', 'cheese', 'paneer', 'ragi']):
        gaps.append({
            "nutrient": "Calcium",
            "status": "Low",
            "current_estimated": "Low",
            "target": "600mg",
            "suggestion": "Add a glass of milk or curd"
        })
        
    # 3. Vitamin C Check (Citrus, lemon, orange, guava, tomato, amla)
    if not any(x in meal_names for x in ['orange', 'lemon', 'guava', 'tomato', 'amla', 'capsicum', 'fruit']):
        gaps.append({
            "nutrient": "Vitamin C",
            "status": "Moderate",
            "current_estimated": "Low",
            "target": "40mg",
            "suggestion": "Add orange or guava"
        })
        
    # 4. Protein Check (Dal, eggs, meat, paneer, soya, nuts)
    if not any(x in meal_names for x in ['dal', 'egg', 'chicken', 'fish', 'paneer', 'soya', 'nut', 'sprout']):
        gaps.append({
            "nutrient": "Protein",
            "status": "Low",
            "current_estimated": "Low",
            "target": "20g",
            "suggestion": "Add lentils/dal or eggs"
        })

    score = 100 - (len(gaps) * 15)
    summary = "Basic analysis based on food groups (AI unavailable)." if gaps else "Diet looks balanced based on food groups."

    return {
        "analysis_summary": summary,
        "deficiencies": gaps,
        "score": max(score, 40)
    }



from services.nutrition_analysis import calculate_deficiencies, analyze_trends
from services.risk_engine import assess_risk
from services.plan_generator import generate_diet_plan
from models import DietPlanRequest, DietPlanResponse

@app.post("/generate-adaptive-plan", response_model=DietPlanResponse)
async def generate_adaptive_plan(request: DietPlanRequest):
    print(f"Received localized plan request for child age: {request.child_profile.age}")
    
    # 1. PRE-ANALYSIS PHASE
    deficiencies = calculate_deficiencies([m.dict() for m in request.meal_logs], request.child_profile.age)
    trend = analyze_trends([m.dict() for m in request.meal_logs])
    
    # 2. RISK CHECK
    risk_assessment = assess_risk(
        request.child_profile.dict(), 
        deficiencies, 
        request.doctor_notes or ""
    )
    
    print(f"Risk Level: {risk_assessment.risk_level}")
    
    # If High Risk, Halt
    if not risk_assessment.can_generate_plan:
        return DietPlanResponse(
            status="REQUIRES_DOCTOR_REVIEW",
            reason=risk_assessment.reason,
            risk_level=risk_assessment.risk_level,
            doctor_summary={
                "risk_flags": risk_assessment.flags,
                "recommendation": "Manual Clinical Review Required"
            }
        )

    # 3. PERSONALIZED PLAN GENERATION
    diet_plan = await generate_diet_plan(
        hf_client,
        gemini_client,
        request.child_profile.dict(),
        deficiencies,
        risk_assessment.risk_level,
        request.duration_days,
        request.doctor_notes or ""
    )
    
    return diet_plan

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
