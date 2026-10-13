import os
import io
import json
import torch
from typing import Dict, Any, List, Optional
from PIL import Image
from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Try importing generative AI for fallback support
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# Load environment variables
load_dotenv()

app = FastAPI(title="NutriBite Food Recognition Model Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for classification
classifier = None
device = "cpu"

print("[FoodRecognitionAI] Skipping local model loading. Using Gemini API directly.")

# Mapping of Food-101 labels to portion estimates
PORTION_ESTIMATES = {
    "samosa": "2 pieces",
    "pizza": "1 slice",
    "hamburger": "1 piece",
    "caesar_salad": "1 serving",
    "chocolate_cake": "1 slice",
    "cup_cakes": "1 piece",
    "donuts": "1 piece",
    "ice_cream": "1 scoop",
    "pancakes": "2 pieces",
    "waffles": "1 piece",
    "french_fries": "1 regular serving",
    "hot_dog": "1 piece",
    "tacos": "2 pieces",
    "sushi": "6 pieces",
    "macaroni_and_cheese": "1 bowl",
    "panna_cotta": "1 cup",
    "apple_pie": "1 slice",
    "chicken_wings": "4 pieces",
    "spring_rolls": "3 pieces",
    "club_sandwich": "1 piece",
    "garlic_bread": "2 slices",
    "onion_rings": "6 pieces",
    "dumplings": "5 pieces",
    "strawberry_shortcake": "1 slice"
}

# Standard Indian pediatric food default mapping (fallback for Indian plates)
INDIAN_FOODS_NUTRITION = {
    "idli": {"calories": 60, "protein": 1.25, "carbs": 13, "fats": 0.1},
    "sambar": {"calories": 150, "protein": 5.0, "carbs": 20, "fats": 3.0},
    "banana": {"calories": 105, "protein": 1.3, "carbs": 27, "fats": 0.3},
    "dosa": {"calories": 130, "protein": 3.0, "carbs": 22, "fats": 4.0},
    "roti": {"calories": 104, "protein": 3.0, "carbs": 22, "fats": 0.5},
    "chapathi": {"calories": 104, "protein": 3.0, "carbs": 22, "fats": 0.5},
    "rice": {"calories": 200, "protein": 4.0, "carbs": 44, "fats": 0.5},
    "dal": {"calories": 150, "protein": 7.0, "carbs": 20, "fats": 4.0},
    "paneer": {"calories": 265, "protein": 18.0, "carbs": 1.0, "fats": 20.0},
    "egg": {"calories": 78, "protein": 6.0, "carbs": 0.6, "fats": 5.0},
    "milk": {"calories": 150, "protein": 8.0, "carbs": 12, "fats": 8.0},
    "apple": {"calories": 95, "protein": 0.5, "carbs": 25, "fats": 0.3},
    "curd": {"calories": 100, "protein": 5.0, "carbs": 6, "fats": 6.0},
    "vegetable curry": {"calories": 150, "protein": 3.0, "carbs": 18, "fats": 7.0},
    "chicken curry": {"calories": 280, "protein": 25.0, "carbs": 8, "fats": 15.0},
    "fish curry": {"calories": 250, "protein": 20.0, "carbs": 6, "fats": 15.0},
    "upma": {"calories": 220, "protein": 4.0, "carbs": 30, "fats": 8.0},
    "poha": {"calories": 200, "protein": 3.0, "carbs": 35, "fats": 7.0},
    "biryani": {"calories": 500, "protein": 25.0, "carbs": 60, "fats": 18.0}
}

def clean_label(label: str) -> str:
    """Standardizes Hugging Face model output labels."""
    return label.replace("_", " ").strip().lower()

def run_gemini_fallback(image_bytes: bytes) -> Dict[str, Any]:
    """Generates structured analysis output using Gemini multimodal models."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not (GENAI_AVAILABLE and api_key):
        raise ValueError("Gemini is not configured or python dependencies are missing.")
    
    print("[FoodRecognitionAI] Invoking Gemini Multimodal Fallback...")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    image = Image.open(io.BytesIO(image_bytes))
    
    prompt = (
        "Analyze this image of a child's food plate. Identify all food items. "
        "Estimate serving size/portion (e.g. '1 bowl', '2 pieces'). "
        "Estimate calories, protein (g), carbs (g), and fat (g) for each. "
        "Respond ONLY in valid, raw JSON with this format:\n"
        "{\n"
        "  \"foods\": [\"idli\", \"sambar\", \"banana\"],\n"
        "  \"confidence_scores\": [0.95, 0.90, 0.98],\n"
        "  \"portion_estimates\": {\n"
        "     \"idli\": \"2 pieces\",\n"
        "     \"sambar\": \"1 bowl\",\n"
        "     \"banana\": \"1 medium\"\n"
        "  }\n"
        "}\n"
        "Do not include markdown tags. Output raw JSON text."
    )
    
    response = model.generate_content([prompt, image])
    text = response.text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "google/gemini-2.5-flash", "device": "api"}

@app.post("/api/food-recognition")
async def food_recognition_endpoint(file: UploadFile = File(...), corrections: Optional[str] = Form(None)):
    """
    Main endpoint for food image recognition.
    Queries the Gemini 2.5 Flash API.
    """
    try:
        contents = await file.read()
        
        # Log details
        print(f"[FoodRecognitionAI] Image Name: {file.filename}")
        print(f"[FoodRecognitionAI] Image Size: {len(contents)} bytes")
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not (GENAI_AVAILABLE and api_key):
            print("[FoodRecognitionAI] Gemini API is not configured or python dependencies are missing.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Gemini API is not configured or python dependencies are missing."
            )
            
        print("[FoodRecognitionAI] Inference Started (Gemini API)")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        
        corrections_context = ""
        if corrections:
            try:
                corrections_list = json.loads(corrections)
                if isinstance(corrections_list, list) and len(corrections_list) > 0:
                    corrections_context = "\nPersonalization / Past Corrections (Avoid repeating these mistakes):\n"
                    for corr in corrections_list:
                        orig_food = corr.get("originalFood", "")
                        orig_qty = corr.get("originalQuantity", "")
                        corr_food = corr.get("correctedFood", "")
                        corr_qty = corr.get("correctedQuantity", "")
                        corrections_context += f"- If you detect '{orig_food}' or a similar item (which the user previously corrected to '{corr_food}'), check if it should indeed be '{corr_food}'. Also, if the quantity is detected as '{orig_qty}', note that the user corrected it to '{corr_qty}'. Use this feedback to make a more accurate detection.\n"
                    print(f"[FoodRecognitionAI] Added {len(corrections_list)} corrections context to Gemini prompt.")
            except Exception as ce:
                print(f"[FoodRecognitionAI] Error parsing corrections: {str(ce)}")

        prompt = (
            "Analyze this image of a child's food plate. Identify all food items. "
            "Estimate serving size/portion (e.g. '1 bowl', '2 pieces', '1 serving'). "
            "Respond ONLY in valid, raw JSON with this format:\n"
            "{\n"
            "  \"foods\": [\"dosa\", \"sambar\"],\n"
            "  \"confidence_scores\": [0.95, 0.90],\n"
            "  \"portion_estimates\": {\n"
            "     \"dosa\": \"1 piece\",\n"
            "     \"sambar\": \"1 bowl\"\n"
            "  }\n"
            "}\n"
            "Do not include markdown tags or triple backticks. Output raw JSON text."
        )
        if corrections_context:
            prompt += "\n" + corrections_context
        
        response = model.generate_content([prompt, img])
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        data = json.loads(text)
        foods = [f.strip().lower() for f in data.get("foods", [])]
        confidence_scores = [float(s) for s in data.get("confidence_scores", [])]
        portion_estimates = {k.strip().lower(): v for k, v in data.get("portion_estimates", {}).items()}
        
        print(f"[FoodRecognitionAI] Inference Completed (Gemini API)")
        
        raw_predictions = [{"label": food, "score": score} for food, score in zip(foods, confidence_scores)]
        
        response_payload = {
            "foods": foods,
            "confidence_scores": confidence_scores,
            "portion_estimates": portion_estimates,
            "raw_predictions": raw_predictions
        }
        print(f"[FoodRecognitionAI] Prediction Returned: {response_payload}")
        return response_payload
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FoodRecognitionAI] Inference encountered an error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failed: {str(e)}"
        )

@app.post("/api/debug-food-analysis")
async def debug_food_analysis_endpoint(file: UploadFile = File(...), corrections: Optional[str] = Form(None)):
    """
    Debug endpoint returning raw prediction details, detected classes, and processing timing.
    """
    import time
    try:
        contents = await file.read()
        print(f"[FoodRecognitionAI] [Debug] Image Name: {file.filename}")
        print(f"[FoodRecognitionAI] [Debug] Image Size: {len(contents)} bytes")
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not (GENAI_AVAILABLE and api_key):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Gemini API is not configured or python dependencies are missing."
            )
            
        print("[FoodRecognitionAI] [Debug] Inference Started")
        start_time = time.time()
        
        await file.seek(0)
        res = await food_recognition_endpoint(file, corrections=corrections)
        
        inference_time_ms = (time.time() - start_time) * 1000
        print(f"[FoodRecognitionAI] [Debug] Inference Completed in {inference_time_ms:.2f}ms")
        
        raw_predictions = res.get("raw_predictions", [])
        detected_classes = res.get("foods", [])
        confidence = float(res.get("confidence_scores", [0.0])[0]) if res.get("confidence_scores") else 0.0
        
        response_payload = {
            "raw_predictions": raw_predictions,
            "confidence": confidence,
            "detected_classes": detected_classes,
            "inference_time_ms": inference_time_ms
        }
        print(f"[FoodRecognitionAI] [Debug] Prediction Returned: {response_payload}")
        return response_payload
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FoodRecognitionAI] [Debug] Inference error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Debug inference failed: {str(e)}"
        )

@app.post("/analyze-image")
async def analyze_image_legacy(file: UploadFile = File(...)):
    """
    Backwards-compatible legacy endpoint supporting previous slot-based backend calls.
    Translates response to include parsed foods array and nutrients totals.
    """
    try:
        # Run recognition
        res = await food_recognition_endpoint(file)
        foods = res.get("foods", [])
        portions = res.get("portion_estimates", {})
        
        parsed_foods = []
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        
        for food in foods:
            # Map nutrients
            nutrients = INDIAN_FOODS_NUTRITION.get(food, {"calories": 150, "protein": 4.0, "carbs": 20.0, "fats": 5.0})
            qty = portions.get(food, "1 serving")
            
            # Simple multiplier if portion size specifies count
            multiplier = 1.0
            if "2" in qty:
                multiplier = 2.0
            
            cal = int(nutrients["calories"] * multiplier)
            p = float(nutrients["protein"] * multiplier)
            c = float(nutrients["carbs"] * multiplier)
            f = float(nutrients["fats"] * multiplier)
            
            total_calories += cal
            total_protein += p
            total_carbs += c
            total_fat += f
            
            parsed_foods.append({
                "name": food,
                "quantity": qty,
                "calories": cal,
                "protein": p,
                "carbs": c,
                "fats": f
            })
            
        return {
            "foods": parsed_foods,
            "totals": {
                "calories": total_calories,
                "protein": total_protein,
                "carbs": total_carbs,
                "fat": total_fat
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Legacy proxy analysis error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
