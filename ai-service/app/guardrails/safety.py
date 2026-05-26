from typing import List, Dict, Any
from datetime import datetime

EMERGENCY_KEYWORDS = [
    "breathing difficulty", "cannot breathe", "shortness of breath",
    "unconscious", "passed out", "fainted",
    "severe dehydration", "not peeing", "lethargic",
    "very high fever", "convulsions", "seizure",
    "poison", "swallowed coin", "choking"
]

def check_emergency_escalation(query: str) -> str:
    """
    Checks for high-risk, life-threatening symptoms and triggers immediate doctor escalation.
    """
    query_lower = query.lower()
    for keyword in EMERGENCY_KEYWORDS:
        if keyword in query_lower:
            return (
                "⚠️ [CRITICAL ESCALATION] I have detected high-risk symptoms in your query. "
                "I cannot provide pediatric medical diagnosis. Please seek immediate professional medical attention "
                "or visit the nearest emergency hospital right away."
            )
    return ""

def validate_kids_mode_message(message: str) -> str:
    """
    Kids Mode Guardrails.
    - Strictly blocks any diet/weight/medical talks.
    - Suggests talking to parents.
    """
    msg_lower = message.lower()
    unsafe_keywords = [
        'diet', 'weight', 'fat', 'thin', 'calories', 'lose', 'gain', 
        'medicine', 'pill', 'sick', 'starve', 'fasting', 'obese', 'skinny'
    ]
    for k in unsafe_keywords:
        if f" {k}" in f" {msg_lower}" or f"{k} " in f"{msg_lower}":
            return (
                "I'm your Food Buddy, and I love talking about yummy, crunchy fruits and strong-veggies! 🥦🍎 "
                "For health, growing, or medical questions, it's best to ask your parents or a friendly doctor. "
                "Let's talk about what super-veg you ate today instead! 🦸‍♂️"
            )
    return ""

def check_bedtime_lock() -> bool:
    """
    Returns True if current local hour is outside kid-active boundaries (8:30 PM - 6:00 AM)
    """
    now = datetime.now()
    current_hour = now.hour
    current_minute = now.minute
    
    # 8:30 PM is 20:30
    if current_hour > 20 or (current_hour == 20 and current_minute >= 30) or current_hour < 6:
        return True
    return False

def apply_guardrails(query: str, profile: Dict[str, Any], is_kids_mode: bool = False) -> Dict[str, Any]:
    """
    Runs safety checks.
    """
    if is_kids_mode:
        # 1. Bedtime Lockout Check
        if check_bedtime_lock():
            return {
                "safe": False,
                "escalation": False,
                "response": "💤 Yawn... Your Food Buddy is fast asleep in the veggie garden! 🥦 Let's play again tomorrow morning after 6:00 AM!"
            }
            
        # 2. Kids Mode Medical Restrictions
        kids_check = validate_kids_mode_message(query)
        if kids_check:
            return {
                "safe": False,
                "escalation": True,
                "response": kids_check
            }
            
    # Regular emergency check
    emergency_response = check_emergency_escalation(query)
    if emergency_response:
        return {
            "safe": False,
            "escalation": True,
            "response": emergency_response
        }
        
    return {"safe": True, "escalation": False, "response": ""}
