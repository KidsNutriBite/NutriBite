import os
import io
import json
import time
import tempfile
from typing import Dict, Any, List, Optional
from PIL import Image
from fastapi import FastAPI, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Suppress matplotlib and ultralytics cache permission issues on Windows
temp_cache_dir = os.path.join(tempfile.gettempdir(), "nutribite_cache")
os.makedirs(temp_cache_dir, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", temp_cache_dir)
os.environ.setdefault("YOLO_CONFIG_DIR", temp_cache_dir)

load_dotenv()

# Try importing ultralytics for YOLO
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False

# Try importing Google Generative AI for fallback
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

app = FastAPI(title="NutriBite Food Recognition Model Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Model Initialization
# -------------------------------------------------------------
MODEL_PATH = os.getenv(
    "FOOD_MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "models", "bestV6.pt")
)

yolo_model = None
device = "cpu"

if ULTRALYTICS_AVAILABLE and os.path.exists(MODEL_PATH):
    try:
        print(f"[FoodRecognitionAI] Loading YOLO segmentation model from: {MODEL_PATH}")
        yolo_model = YOLO(MODEL_PATH)
        print(f"[FoodRecognitionAI] YOLO model loaded successfully. Classes count: {len(yolo_model.names)}")
    except Exception as e:
        print(f"[FoodRecognitionAI] Warning: Failed to load YOLO model: {e}")
        yolo_model = None
else:
    print(f"[FoodRecognitionAI] YOLO model not found at {MODEL_PATH} or ultralytics not installed.")

# -------------------------------------------------------------
# Portion Estimation Rules for 68 Indian Pediatric Categories
# -------------------------------------------------------------
UNIT_RULES = {
    # Pieces
    "idli": "piece",
    "dosa": "piece",
    "roti": "piece",
    "naan": "piece",
    "boiled egg": "piece",
    "omelette": "piece",
    "bread roll": "piece",
    "bread": "slice",
    "avocado toast": "slice",
    "paniyaram": "piece",
    "kathi roll": "roll",
    "roll": "roll",
    "chicken piece": "piece",
    "fried red chili": "piece",
    "orange": "medium",
    
    # Bowls / Plates (Rice, Biryani, Grains)
    "rice": "bowl",
    "biryani": "bowl",
    "biryani rice": "bowl",
    "chicken biryani": "plate",
    "mushroom biryani": "bowl",
    "curd rice": "bowl",
    "sambar rice": "plate",
    "lemon rice": "bowl",
    "carrot rice": "bowl",
    "curry rice": "bowl",
    "dal rice": "plate",
    "egg fried rice": "bowl",
    "green rice": "bowl",
    "vegetable rice": "bowl",
    "yellow rice": "bowl",
    "rice with sambar": "plate",
    "poha": "bowl",
    "pongal": "bowl",
    
    # Small bowls (Curries, Dals, Gravies)
    "dal": "small bowl",
    "dal curry": "small bowl",
    "lentil curry": "small bowl",
    "sambar": "small bowl",
    "sambar idli": "plate",
    "chicken curry": "small bowl",
    "cooked chicken": "small bowl",
    "cooked meat": "small bowl",
    "curry": "small bowl",
    "dry vegetable curry": "small bowl",
    "vegetable curry": "small bowl",
    
    # Cups (Fries, Poriyals, Sabzis, Sides)
    "beetroot fry": "cup",
    "beetroot poriyal": "cup",
    "beetroot": "cup",
    "chicken fry": "cup",
    "fish fry": "piece",
    "fry": "cup",
    "ladies finger fry": "cup",
    "meal maker fry": "cup",
    "saag bhaji": "cup",
    "spinach fry": "cup",
    "vegetable fry": "cup",
    "vegetable sabzi": "cup",
    
    # Raitas & Curd
    "curd": "small cup",
    "raita": "small cup",
    "boondi raita": "small cup",
    "cucumber raita": "small cup",
    
    # Chutneys, Podi, Condiments
    "chutney": "2 tbsp",
    "coconut chutney": "2 tbsp",
    "green chutney": "2 tbsp",
    "podi": "1 tbsp",
    "chopped red onion": "2 tbsp",
    
    # Fruits
    "apple slices": "bowl",
    "blueberries": "cup",
    "sliced fruit": "bowl"
}

def estimate_portion(food_name: str, count: int = 1) -> str:
    """Computes a realistic portion size string for pediatric meals."""
    key = food_name.lower().strip()
    unit = UNIT_RULES.get(key)
    if not unit:
        # Fallback heuristic
        if "rice" in key or "biryani" in key or "poha" in key or "pongal" in key:
            unit = "bowl"
        elif "curry" in key or "dal" in key or "sambar" in key:
            unit = "small bowl"
        elif "chutney" in key or "podi" in key:
            return "2 tbsp"
        elif "fry" in key or "sabzi" in key:
            unit = "cup"
        else:
            unit = "serving"

    if unit in ["2 tbsp", "1 tbsp"]:
        return unit

    if count <= 1:
        if unit == "piece":
            if key == "idli":
                return "2 pieces"
            if key == "paniyaram":
                return "4 pieces"
            if key == "roti":
                return "2 pieces"
            return f"1 {unit}"
        return f"1 {unit}"
    else:
        if unit == "piece":
            return f"{count} pieces"
        elif unit == "slice":
            return f"{count} slices"
        elif unit == "roll":
            return f"{count} rolls"
        elif unit == "bowl":
            return f"{count} bowls"
        elif unit == "small bowl":
            return f"{count} small bowls"
        elif unit == "cup":
            return f"{count} cups"
        elif unit == "small cup":
            return f"{count} small cups"
        else:
            return f"{count} {unit}s"

# Nutrition baseline table for legacy fallback
INDIAN_FOODS_NUTRITION = {
    "idli": {"calories": 60, "protein": 2.0, "carbs": 12.0, "fats": 0.2},
    "sambar": {"calories": 140, "protein": 5.5, "carbs": 18.0, "fats": 3.2},
    "banana": {"calories": 105, "protein": 1.3, "carbs": 27.0, "fats": 0.3},
    "dosa": {"calories": 130, "protein": 3.0, "carbs": 22.0, "fats": 4.0},
    "plain dosa": {"calories": 130, "protein": 3.0, "carbs": 22.0, "fats": 4.0},
    "roti": {"calories": 104, "protein": 3.0, "carbs": 22.0, "fats": 0.5},
    "rice": {"calories": 200, "protein": 4.0, "carbs": 44.0, "fats": 0.5},
    "white rice": {"calories": 200, "protein": 4.0, "carbs": 44.0, "fats": 0.5},
    "biryani": {"calories": 350, "protein": 9.0, "carbs": 52.0, "fats": 12.0},
    "chicken biryani": {"calories": 450, "protein": 26.0, "carbs": 54.0, "fats": 14.0},
    "dal": {"calories": 150, "protein": 7.0, "carbs": 20.0, "fats": 4.0},
    "dal fry": {"calories": 150, "protein": 7.0, "carbs": 20.0, "fats": 4.0},
    "paneer": {"calories": 265, "protein": 18.0, "carbs": 1.0, "fats": 20.0},
    "boiled egg": {"calories": 78, "protein": 6.0, "carbs": 0.6, "fats": 5.0},
    "omelette": {"calories": 120, "protein": 7.0, "carbs": 1.0, "fats": 9.0},
    "curd": {"calories": 100, "protein": 5.0, "carbs": 6.0, "fats": 6.0},
    "curd rice": {"calories": 220, "protein": 5.5, "carbs": 38.0, "fats": 5.0},
    "vegetable curry": {"calories": 140, "protein": 3.0, "carbs": 18.0, "fats": 6.0},
    "chicken curry": {"calories": 280, "protein": 25.0, "carbs": 8.0, "fats": 15.0},
    "chutney": {"calories": 75, "protein": 1.0, "carbs": 3.0, "fats": 7.0},
    "coconut chutney": {"calories": 75, "protein": 1.0, "carbs": 3.0, "fats": 7.0},
    "poha": {"calories": 200, "protein": 3.0, "carbs": 35.0, "fats": 7.0},
    "pongal": {"calories": 230, "protein": 5.0, "carbs": 38.0, "fats": 7.0}
}

# -------------------------------------------------------------
# Inference Helpers
# -------------------------------------------------------------
def run_yolo_inference(image: Image.Image, conf_threshold: float = 0.25) -> Dict[str, Any]:
    """Runs YOLOv8/v11 segmentation on a PIL Image and structures the output."""
    if yolo_model is None:
        raise ValueError("YOLO model is not initialized.")

    results = yolo_model.predict(image, conf=conf_threshold, verbose=False)
    
    detected_counts: Dict[str, int] = {}
    detected_max_conf: Dict[str, float] = {}
    raw_predictions: List[Dict[str, Any]] = []
    detected_boxes: List[Dict[str, Any]] = []
    has_masks = False

    for r in results:
        if r.masks is not None and len(r.masks) > 0:
            has_masks = True
            
        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            class_name = yolo_model.names[cls_id]
            coords = [round(float(c), 2) for c in box.xyxy[0].tolist()]

            # Count occurrences
            detected_counts[class_name] = detected_counts.get(class_name, 0) + 1
            if conf > detected_max_conf.get(class_name, 0.0):
                detected_max_conf[class_name] = conf

            detected_boxes.append({
                "name": class_name,
                "confidence": round(conf, 4),
                "box": coords
            })

    # Prepare sorted unique food lists
    unique_foods = sorted(detected_counts.keys(), key=lambda f: detected_max_conf[f], reverse=True)
    confidence_scores = [round(detected_max_conf[f], 4) for f in unique_foods]
    
    portion_estimates: Dict[str, str] = {}
    for f in unique_foods:
        portion_estimates[f] = estimate_portion(f, detected_counts[f])

    for f in unique_foods:
        raw_predictions.append({
            "label": f,
            "score": round(detected_max_conf[f], 4),
            "count": detected_counts[f],
            "portion": portion_estimates[f]
        })

    return {
        "foods": unique_foods,
        "confidence_scores": confidence_scores,
        "portion_estimates": portion_estimates,
        "raw_predictions": raw_predictions,
        "detected_boxes": detected_boxes,
        "has_masks": has_masks,
        "provider": "bestV6_yolo_segmentation"
    }

def run_gemini_fallback(image_bytes: bytes, corrections_context: str = "") -> Dict[str, Any]:
    """Generates structured analysis output using Gemini multimodal models when local model is unavailable or empty."""
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_VISION_API_KEY")
    if not (GENAI_AVAILABLE and api_key):
        return {
            "foods": [],
            "confidence_scores": [],
            "portion_estimates": {},
            "raw_predictions": [],
            "provider": "none"
        }
    
    print("[FoodRecognitionAI] Invoking Gemini Multimodal Fallback...")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    prompt = (
        "Analyze this image of a child's food plate. Identify all food items. "
        "Estimate serving size/portion (e.g. '1 bowl', '2 pieces', '1 cup'). "
        "Respond ONLY in valid, raw JSON with this format:\n"
        "{\n"
        "  \"foods\": [\"Idli\", \"Sambar\"],\n"
        "  \"confidence_scores\": [0.95, 0.90],\n"
        "  \"portion_estimates\": {\n"
        "     \"Idli\": \"2 pieces\",\n"
        "     \"Sambar\": \"1 bowl\"\n"
        "  }\n"
        "}\n"
        "Do not include markdown tags or triple backticks. Output raw JSON text."
    )
    if corrections_context:
        prompt += "\n" + corrections_context
    
    response = model.generate_content([prompt, image])
    text = response.text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    data = json.loads(text.strip())
    
    foods = [f.strip() for f in data.get("foods", [])]
    confidence_scores = [float(s) for s in data.get("confidence_scores", [])]
    portion_estimates = data.get("portion_estimates", {})
    raw_predictions = [{"label": food, "score": score} for food, score in zip(foods, confidence_scores)]

    return {
        "foods": foods,
        "confidence_scores": confidence_scores,
        "portion_estimates": portion_estimates,
        "raw_predictions": raw_predictions,
        "provider": "gemini_multimodal_fallback"
    }

def apply_corrections(result_payload: Dict[str, Any], corrections_raw: Optional[str]) -> Dict[str, Any]:
    """Applies past parent feedback corrections to improve prediction accuracy."""
    if not corrections_raw:
        return result_payload

    try:
        corrections = json.loads(corrections_raw)
        if not isinstance(corrections, list) or len(corrections) == 0:
            return result_payload

        foods = result_payload.get("foods", [])
        portions = result_payload.get("portion_estimates", {})

        for corr in corrections:
            orig = (corr.get("originalFood") or corr.get("predictedFood") or "").strip().lower()
            corrected = (corr.get("correctedFood") or corr.get("actualFood") or "").strip()
            corr_qty = (corr.get("correctedQuantity") or corr.get("actualQuantity") or "").strip()

            if not orig or not corrected:
                continue

            for idx, f in enumerate(foods):
                if f.strip().lower() == orig:
                    print(f"[FoodRecognitionAI] Self-learning: Replacing '{f}' with parent correction '{corrected}'")
                    foods[idx] = corrected
                    if corr_qty:
                        portions[corrected] = corr_qty
                    elif f in portions:
                        portions[corrected] = portions.pop(f)

        result_payload["foods"] = foods
        result_payload["portion_estimates"] = portions
    except Exception as e:
        print(f"[FoodRecognitionAI] Warning applying corrections: {e}")

    return result_payload

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model": "bestV6.pt (YOLOv8 Segmentation)",
        "model_loaded": yolo_model is not None,
        "classes_count": len(yolo_model.names) if yolo_model else 0,
        "task": yolo_model.task if yolo_model else None,
        "device": device
    }

@app.post("/api/food-recognition")
async def food_recognition_endpoint(
    file: UploadFile = File(...),
    corrections: Optional[str] = Form(None)
):
    """
    Main endpoint for meal logging image recognition.
    Runs bestV6.pt YOLO segmentation model, falling back to Gemini if needed.
    """
    try:
        contents = await file.read()
        print(f"[FoodRecognitionAI] Received image: {file.filename} ({len(contents)} bytes)")

        result = None

        # 1. Primary: Run YOLO bestV6.pt
        if yolo_model is not None:
            try:
                img = Image.open(io.BytesIO(contents)).convert("RGB")
                print(f"[FoodRecognitionAI] Running YOLO segmentation inference on image size {img.size}...")
                yolo_result = run_yolo_inference(img, conf_threshold=0.20)
                
                if len(yolo_result.get("foods", [])) > 0:
                    result = yolo_result
                    print(f"[FoodRecognitionAI] YOLO detected foods: {result['foods']}")
                else:
                    print("[FoodRecognitionAI] YOLO detected no food above confidence threshold.")
            except Exception as yolo_err:
                print(f"[FoodRecognitionAI] YOLO inference error: {yolo_err}")

        # 2. Secondary fallback: Gemini Vision (if YOLO had 0 detections or failed)
        if not result or len(result.get("foods", [])) == 0:
            if GENAI_AVAILABLE and (os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_VISION_API_KEY")):
                print("[FoodRecognitionAI] Triggering Gemini Vision fallback...")
                result = run_gemini_fallback(contents)
            else:
                # Return empty detection safely if no fallback
                if not result:
                    result = {
                        "foods": [],
                        "confidence_scores": [],
                        "portion_estimates": {},
                        "raw_predictions": [],
                        "provider": "bestV6_yolo_segmentation"
                    }

        # 3. Apply user corrections / learning
        result = apply_corrections(result, corrections)
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[FoodRecognitionAI] Inference encountered an error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failed: {str(e)}"
        )

@app.post("/api/debug-food-analysis")
async def debug_food_analysis_endpoint(
    file: UploadFile = File(...),
    corrections: Optional[str] = Form(None)
):
    """
    Debug endpoint for Model Playground with detailed timing and prediction metrics.
    """
    try:
        start_time = time.time()
        contents = await file.read()
        
        await file.seek(0)
        res = await food_recognition_endpoint(file, corrections=corrections)
        
        inference_time_ms = round((time.time() - start_time) * 1000, 2)
        raw_predictions = res.get("raw_predictions", [])
        detected_classes = res.get("foods", [])
        confidence = float(res.get("confidence_scores", [0.0])[0]) if res.get("confidence_scores") else 0.0

        return {
            "raw_predictions": raw_predictions,
            "confidence": confidence,
            "detected_classes": detected_classes,
            "detected_boxes": res.get("detected_boxes", []),
            "inference_time_ms": inference_time_ms,
            "provider": res.get("provider", "bestV6_yolo_segmentation")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Debug inference failed: {str(e)}"
        )

@app.post("/analyze-image")
async def analyze_image_legacy(file: UploadFile = File(...)):
    """
    Backwards-compatible legacy endpoint returning food items and aggregated nutrients.
    """
    try:
        res = await food_recognition_endpoint(file)
        foods = res.get("foods", [])
        portions = res.get("portion_estimates", {})
        
        parsed_foods = []
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        
        for food in foods:
            food_key = food.lower().strip()
            nutrients = INDIAN_FOODS_NUTRITION.get(food_key, {"calories": 140, "protein": 4.0, "carbs": 20.0, "fats": 4.0})
            qty = portions.get(food, "1 serving")
            
            # Simple multiplier if portion size specifies count
            multiplier = 1.0
            if "2" in qty:
                multiplier = 2.0
            elif "3" in qty:
                multiplier = 3.0
            elif "4" in qty:
                multiplier = 4.0
            
            cal = int(nutrients["calories"] * multiplier)
            p = round(float(nutrients["protein"] * multiplier), 2)
            c = round(float(nutrients["carbs"] * multiplier), 2)
            f = round(float(nutrients["fats"] * multiplier), 2)
            
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
                "protein": round(total_protein, 2),
                "carbs": round(total_carbs, 2),
                "fat": round(total_fat, 2)
            },
            "provider": res.get("provider", "bestV6_yolo_segmentation")
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Legacy analysis error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
