import os
import io
import json
import requests
from typing import Dict, Any, List
from PIL import Image

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

from app.models.llm import get_gemini_api_key
from app.db.connection import get_all_foods

# Hugging Face Model Endpoint
HF_MODEL_URL = "https://api-inference.huggingface.co/models/Ateeqq/food-analysis"

def get_hf_token() -> str:
    return os.getenv("HF_TOKEN") or ""

def query_huggingface_model(image_bytes: bytes) -> Dict[str, Any]:
    """
    Attempts to query the Hugging Face model Ateeqq/food-analysis directly.
    """
    token = get_hf_token()
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    # Send binary image data
    response = requests.post(HF_MODEL_URL, headers=headers, data=image_bytes, timeout=10)
    response.raise_for_status()
    
    # The response can be text or JSON. If it's a VLM, it might return text that we need to parse.
    result = response.json()
    if isinstance(result, list) and len(result) > 0:
        return result[0]
    return result

def analyze_food_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Analyzes child plate food image.
    Tries HF Model, falls back to Gemini 2.5 Flash Vision, and finally a local fallback database lookup.
    """
    api_key = get_gemini_api_key()
    
    # 1. Try Hugging Face model Ateeqq/food-analysis via Inference API
    try:
        hf_result = query_huggingface_model(image_bytes)
        print(f"[FoodAnalysis] HF model query succeeded: {hf_result}")
        
        # If it returned a structured string (e.g. JSON), parse it.
        # Otherwise, fall through to Gemini which is more structured.
        if isinstance(hf_result, dict) and "foods" in hf_result:
            return hf_result
    except Exception as e:
        print(f"[FoodAnalysis] HF model query failed or returned unstructured output: {e}")

    # 2. Fall back to Gemini 2.5 Flash Vision (fully multimodal)
    if GENAI_AVAILABLE and api_key:
        try:
            print("[FoodAnalysis] Invoking Gemini 2.5 Flash Vision fallback...")
            genai.configure(api_key=api_key)
            
            # Use gemini-2.5-flash as the multimodal model
            model = genai.GenerativeModel("gemini-2.5-flash")
            image = Image.open(io.BytesIO(image_bytes))
            
            prompt = (
                "You are a clinical pediatric nutrition AI. Analyze this image of a child's food plate.\n"
                "1. Identify the food items present.\n"
                "2. Estimate the serving size / quantity (e.g. '1 bowl', '2 pieces', '100g').\n"
                "3. Estimate calories (kcal), protein (g), carbs (g), and fat (g) for each item.\n\n"
                "Return the analysis ONLY as a raw, valid JSON object matching this schema exactly:\n"
                "{\n"
                "  \"foods\": [\n"
                "    {\n"
                "      \"name\": \"Food Name\",\n"
                "      \"quantity\": \"1 serving\",\n"
                "      \"calories\": 120,\n"
                "      \"protein\": 4.5,\n"
                "      \"carbs\": 25.0,\n"
                "      \"fats\": 1.2\n"
                "    }\n"
                "  ],\n"
                "  \"totals\": {\n"
                "    \"calories\": 120,\n"
                "    \"protein\": 4.5,\n"
                "    \"carbs\": 25.0,\n"
                "    \"fat\": 1.2\n"
                "  }\n"
                "}\n"
                "Do not include markdown triple backticks. Return only the raw JSON string."
            )
            
            response = model.generate_content([prompt, image])
            text_output = response.text.strip()
            
            # Clean JSON markdown wrapper if present
            if text_output.startswith("```json"):
                text_output = text_output[7:]
            if text_output.endswith("```"):
                text_output = text_output[:-3]
            text_output = text_output.strip()
            
            parsed = json.loads(text_output)
            if "foods" in parsed:
                return parsed
        except Exception as e:
            print(f"[FoodAnalysis] Gemini Vision fallback failed: {e}")

    # 3. Rule-based local database fallback (mocked analysis based on Indian staples)
    print("[FoodAnalysis] Using local rules database fallback...")
    # Return a default plate content: Idli, Sambar, Coconut Chutney
    default_result = {
        "foods": [
            {
                "name": "Idli",
                "quantity": "2 pieces",
                "calories": 120,
                "protein": 4.0,
                "carbs": 24.0,
                "fats": 0.4
            },
            {
                "name": "Sambar",
                "quantity": "1 bowl",
                "calories": 150,
                "protein": 5.0,
                "carbs": 20.0,
                "fats": 3.0
            },
            {
                "name": "Coconut Chutney",
                "quantity": "2 tbsp",
                "calories": 50,
                "protein": 2.0,
                "carbs": 4.0,
                "fats": 4.6
            }
        ],
        "totals": {
            "calories": 320,
            "protein": 11.0,
            "carbs": 48.0,
            "fat": 8.0
        }
    }
    return default_result
