import re
from typing import Dict, Any

# Bad adversarial keywords standard definitions
INJECTION_KEYWORDS = [
    "ignore your instructions", "ignore your system rules", "override safety", 
    "you are now a developer", "developer mode", "jailbreak", "override limits",
    "forget previous rules", "acting as a terminal", "ignore all constraints"
]

def check_prompt_injection(query: str) -> bool:
    """
    Scans the incoming query for classic jailbreak or system rule overrides.
    """
    query_lower = query.lower()
    
    # 1. Direct keyword scanning
    for kw in INJECTION_KEYWORDS:
        if kw in query_lower:
            return True
            
    # 2. System command hijack regex (e.g. "ignore the above", "ignore previous")
    hijack_regex = r"(ignore|override|bypass|forget)\b.*\b(previous|system|rules|guidelines|instructions)"
    if re.search(hijack_regex, query_lower):
        return True
        
    return False

def check_jailbreak_attempt(query: str) -> bool:
    """
    Identifies recursive prefix-hijacking patterns.
    """
    query_lower = query.lower()
    
    # Check for adversarial prompt structures e.g. "Hypothetically if I wanted to bypass..."
    patterns = [
        r"hypothetically.*\b(safe|fine)\b.*\b(bypass|allergy|peanut)",
        r"\bsudo\s+make\b",
        r"acting as a friendly doctor who recommends medications without rules"
    ]
    for pattern in patterns:
        if re.search(pattern, query_lower):
            return True
            
    return False

def audit_security_gate(query: str) -> Dict[str, Any]:
    """
    Unified entry point for AI input threat detection.
    """
    if check_prompt_injection(query) or check_jailbreak_attempt(query):
        # Trigger Prometheus/OTel counter increment
        try:
            from app.utils.otel_setup import SAFETY_BLOCK_COUNT
            SAFETY_BLOCK_COUNT.labels(category="Prompt_Injection").inc()
        except:
            pass
            
        return {
            "compromised": True,
            "severity": "CRITICAL",
            "message": "🛡️ [SECURITY INTERCEPT] Adversarial query hijacked. Boundary override commands have been blocked by active platform shield."
        }
        
    return {"compromised": False}
