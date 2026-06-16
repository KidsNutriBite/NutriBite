"""
Growth Velocity Engine
======================
Deterministic, WHO/ICMR-grounded engine for computing pediatric growth velocity metrics.

Inputs  : List of GrowthRecord dicts + child profile (age, gender)
Outputs : Velocity metrics, percentile drift, risk scores, AI insights, recommendations

No LLM required — all computations are pure mathematics against WHO reference data.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import math


# ─── WHO REFERENCE DATA ────────────────────────────────────────────────────────
# Expected monthly height velocity (cm/month) by age bracket (ageInMonths upper bound)
# Source: WHO Child Growth Standards (2006) + WHO Reference 2007 (5–19 years)
WHO_HEIGHT_VELOCITY = [
    {"maxAgeMonths": 12,  "expected": 2.00, "sd": 0.40},  # 0–1yr
    {"maxAgeMonths": 24,  "expected": 1.00, "sd": 0.20},  # 1–2yr
    {"maxAgeMonths": 36,  "expected": 0.70, "sd": 0.15},  # 2–3yr
    {"maxAgeMonths": 60,  "expected": 0.55, "sd": 0.12},  # 3–5yr
    {"maxAgeMonths": 120, "expected": 0.45, "sd": 0.10},  # 5–10yr
    {"maxAgeMonths": 156, "expected": 0.40, "sd": 0.12},  # 10–13yr
    {"maxAgeMonths": 216, "expected": 0.35, "sd": 0.15},  # 13–18yr
]

# Expected monthly weight velocity (kg/month) by age bracket
WHO_WEIGHT_VELOCITY = [
    {"maxAgeMonths": 12,  "expected": 0.55, "sd": 0.15},
    {"maxAgeMonths": 24,  "expected": 0.22, "sd": 0.08},
    {"maxAgeMonths": 36,  "expected": 0.18, "sd": 0.07},
    {"maxAgeMonths": 60,  "expected": 0.16, "sd": 0.06},
    {"maxAgeMonths": 120, "expected": 0.20, "sd": 0.07},
    {"maxAgeMonths": 156, "expected": 0.30, "sd": 0.10},
    {"maxAgeMonths": 216, "expected": 0.35, "sd": 0.12},
]

# WHO BMI-for-age expected ranges by gender/age (simplified median ± 1 SD)
# Used to contextualize BMI velocity direction
WHO_BMI_MEDIAN = {
    "male": [
        {"maxAgeMonths": 24,  "median": 17.0, "sd": 1.5},
        {"maxAgeMonths": 60,  "median": 15.5, "sd": 1.2},
        {"maxAgeMonths": 120, "median": 15.8, "sd": 1.3},
        {"maxAgeMonths": 156, "median": 17.5, "sd": 2.0},
        {"maxAgeMonths": 216, "median": 20.0, "sd": 2.5},
    ],
    "female": [
        {"maxAgeMonths": 24,  "median": 16.8, "sd": 1.5},
        {"maxAgeMonths": 60,  "median": 15.2, "sd": 1.2},
        {"maxAgeMonths": 120, "median": 15.5, "sd": 1.3},
        {"maxAgeMonths": 156, "median": 17.8, "sd": 2.0},
        {"maxAgeMonths": 216, "median": 20.5, "sd": 2.5},
    ],
}


# ─── UTILITY FUNCTIONS ─────────────────────────────────────────────────────────

def _get_who_reference(table: List[Dict], age_months: int) -> Dict:
    """Get the WHO reference band matching this age."""
    for row in table:
        if age_months <= row["maxAgeMonths"]:
            return row
    return table[-1]


def _parse_date(date_val: Any) -> Optional[datetime]:
    """Parse date from string or dict robustly."""
    if date_val is None:
        return None
    if isinstance(date_val, datetime):
        return date_val.replace(tzinfo=None) if date_val.tzinfo else date_val
    if isinstance(date_val, dict):
        # MongoDB-style $date object
        date_val = date_val.get("$date", date_val.get("date", None))
        if date_val is None:
            return None
    if isinstance(date_val, (int, float)):
        # Unix timestamp in milliseconds
        return datetime.utcfromtimestamp(date_val / 1000)
    if isinstance(date_val, str):
        for fmt in ["%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ",
                    "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"]:
            try:
                return datetime.strptime(date_val, fmt)
            except ValueError:
                continue
    return None


def _classify_velocity_status(actual: float, expected: float, sd: float) -> str:
    """Classify velocity against WHO expected band using Z-score approach."""
    if expected == 0:
        return "UNKNOWN"
    deviation = (actual - expected) / sd if sd > 0 else (actual - expected) / (expected * 0.2)
    if deviation < -2.0:
        return "CRITICALLY_LOW"
    if deviation < -1.0:
        return "BELOW_EXPECTED"
    if deviation < 0:
        return "SLIGHTLY_BELOW"
    if deviation <= 1.0:
        return "HEALTHY"
    if deviation <= 2.0:
        return "ABOVE_EXPECTED"
    return "RAPID_ACCELERATING"


def _status_to_display(status: str) -> Dict[str, str]:
    """Map internal status to UI label + color hint."""
    mapping = {
        "CRITICALLY_LOW":      {"label": "Critically Low",      "severity": "critical"},
        "BELOW_EXPECTED":      {"label": "Below Expected",       "severity": "warning"},
        "SLIGHTLY_BELOW":      {"label": "Slightly Below",       "severity": "caution"},
        "HEALTHY":             {"label": "Healthy",              "severity": "healthy"},
        "ABOVE_EXPECTED":      {"label": "Above Expected",       "severity": "good"},
        "RAPID_ACCELERATING":  {"label": "Rapid Acceleration",   "severity": "caution"},
        "UNKNOWN":             {"label": "Insufficient Data",    "severity": "unknown"},
    }
    return mapping.get(status, {"label": status, "severity": "unknown"})


# ─── CORE ENGINE ───────────────────────────────────────────────────────────────

def compute_growth_velocity(
    records: List[Dict[str, Any]],
    profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Main entry point: compute full Growth Velocity analysis from sorted GrowthRecords.

    Args:
        records : List of GrowthRecord dicts (sorted ascending by timestamp)
        profile : Child profile with `age`, `gender`, `dob` (optional), `name`

    Returns:
        Structured velocity analysis dict matching the API response schema.
    """
    gender = (profile.get("gender") or "male").lower()
    if gender not in ("male", "female"):
        gender = "male"

    age_months = profile.get("ageInMonths") or (profile.get("age", 7) * 12)

    # ── 1. Sort & filter valid records ──────────────────────────────────────
    valid_records = []
    for r in records:
        ts = _parse_date(r.get("timestamp") or r.get("createdAt"))
        if ts and r.get("height") and r.get("weight"):
            valid_records.append({**r, "_parsedDate": ts})
    valid_records.sort(key=lambda r: r["_parsedDate"])

    if len(valid_records) < 2:
        return _insufficient_data_response(valid_records, profile, age_months)

    latest = valid_records[-1]
    earliest = valid_records[0]

    # ── 2. Compute point-to-point velocity timeline ──────────────────────────
    velocity_timeline = []
    for i in range(1, len(valid_records)):
        prev = valid_records[i - 1]
        curr = valid_records[i]

        dt_days = (curr["_parsedDate"] - prev["_parsedDate"]).days
        if dt_days < 5:
            continue  # Skip duplicate/same-day records

        months_elapsed = dt_days / 30.44  # Average days per month

        h_vel = (curr["height"] - prev["height"]) / months_elapsed
        w_vel = (curr["weight"] - prev["weight"]) / months_elapsed
        b_vel = ((curr.get("bmi") or 0) - (prev.get("bmi") or 0)) / months_elapsed

        velocity_timeline.append({
            "date": curr["_parsedDate"].strftime("%Y-%m-%d"),
            "heightVelocity": round(h_vel, 3),
            "weightVelocity": round(w_vel, 3),
            "bmiVelocity": round(b_vel, 3),
            "heightCm": curr["height"],
            "weightKg": curr["weight"],
            "bmi": curr.get("bmi"),
            "percentile": curr.get("percentile"),
            "recordedBy": curr.get("recordedByRole", "parent"),
        })

    if not velocity_timeline:
        return _insufficient_data_response(valid_records, profile, age_months)

    # ── 3. Average velocity (last 3 intervals for recency bias) ─────────────
    recent_timeline = velocity_timeline[-3:]
    avg_h_vel = sum(t["heightVelocity"] for t in recent_timeline) / len(recent_timeline)
    avg_w_vel = sum(t["weightVelocity"] for t in recent_timeline) / len(recent_timeline)
    avg_b_vel = sum(t["bmiVelocity"] for t in recent_timeline) / len(recent_timeline)

    # ── 4. WHO reference lookup ──────────────────────────────────────────────
    h_ref = _get_who_reference(WHO_HEIGHT_VELOCITY, age_months)
    w_ref = _get_who_reference(WHO_WEIGHT_VELOCITY, age_months)

    h_status = _classify_velocity_status(avg_h_vel, h_ref["expected"], h_ref["sd"])
    w_status = _classify_velocity_status(avg_w_vel, w_ref["expected"], w_ref["sd"])

    bmi_expected_change = 0.03 if age_months < 60 else 0.01
    if avg_b_vel > 0.15:
        b_status = "RAPID_ACCELERATING"
    elif avg_b_vel < -0.10:
        b_status = "CRITICALLY_LOW"
    elif abs(avg_b_vel) < 0.05:
        b_status = "HEALTHY"
    else:
        b_status = "SLIGHTLY_BELOW" if avg_b_vel < 0 else "ABOVE_EXPECTED"

    # ── 5. Percentile drift analysis ─────────────────────────────────────────
    percentile_history = [
        r.get("percentile") for r in valid_records if r.get("percentile") is not None
    ]
    percentile_drift = _compute_percentile_drift(percentile_history)

    # ── 6. Risk detection ────────────────────────────────────────────────────
    risk_indicators = _detect_risks(
        velocity_timeline, avg_h_vel, avg_w_vel, avg_b_vel,
        h_status, w_status, b_status, percentile_drift
    )

    # ── 7. Scores ─────────────────────────────────────────────────────────────
    stability_score = _compute_stability_score(velocity_timeline, h_ref, w_ref)
    risk_score = _compute_risk_score(risk_indicators, h_status, w_status, b_status, percentile_drift)

    # ── 8. AI Insights ───────────────────────────────────────────────────────
    insights = _generate_insights(
        avg_h_vel, avg_w_vel, avg_b_vel,
        h_status, w_status, b_status,
        h_ref, w_ref,
        percentile_drift, risk_indicators,
        age_months, gender, len(valid_records)
    )
    recommendations = _generate_recommendations(risk_indicators, h_status, w_status, b_status, age_months)

    # ── 9. WHO Percentile Band Data (for chart overlay) ───────────────────────
    who_bands = _generate_who_bands_for_chart(valid_records, gender)

    return {
        "profileId": str(profile.get("_id") or profile.get("profileId") or ""),
        "computedAt": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "recordCount": len(valid_records),
        "currentMetrics": {
            "height": latest.get("height"),
            "weight": latest.get("weight"),
            "bmi": latest.get("bmi"),
            "percentile": latest.get("percentile"),
            "ageInMonths": age_months,
            "recordedAt": latest["_parsedDate"].strftime("%Y-%m-%d"),
        },
        "velocityMetrics": {
            "heightVelocity": {
                "actual": round(avg_h_vel, 3),
                "expected": h_ref["expected"],
                "unit": "cm/month",
                "status": h_status,
                "display": _status_to_display(h_status),
                "whoReference": h_ref,
            },
            "weightVelocity": {
                "actual": round(avg_w_vel, 3),
                "expected": w_ref["expected"],
                "unit": "kg/month",
                "status": w_status,
                "display": _status_to_display(w_status),
                "whoReference": w_ref,
            },
            "bmiVelocity": {
                "actual": round(avg_b_vel, 3),
                "expected": round(bmi_expected_change, 3),
                "unit": "BMI/month",
                "status": b_status,
                "display": _status_to_display(b_status),
            },
        },
        "velocityTimeline": velocity_timeline,
        "growthTimeline": [
            {
                "date": r["_parsedDate"].strftime("%Y-%m-%d"),
                "height": r.get("height"),
                "weight": r.get("weight"),
                "bmi": r.get("bmi"),
                "percentile": r.get("percentile"),
            }
            for r in valid_records
        ],
        "whoBands": who_bands,
        "percentileDrift": percentile_drift,
        "stabilityScore": stability_score,
        "riskScore": risk_score,
        "riskIndicators": risk_indicators,
        "insights": insights,
        "recommendations": recommendations,
    }


# ─── RISK DETECTION ────────────────────────────────────────────────────────────

def _detect_risks(
    timeline: List[Dict],
    avg_h: float, avg_w: float, avg_b: float,
    h_status: str, w_status: str, b_status: str,
    percentile_drift: Dict
) -> List[str]:
    risks = []

    if h_status in ("CRITICALLY_LOW", "BELOW_EXPECTED"):
        risks.append("HEIGHT_PLATEAU")
    if w_status in ("CRITICALLY_LOW", "BELOW_EXPECTED"):
        risks.append("WEIGHT_PLATEAU")
    if b_status == "RAPID_ACCELERATING":
        risks.append("BMI_SPIKE")
    if avg_w < 0:
        risks.append("UNEXPECTED_WEIGHT_DROP")
    if avg_h < 0:
        risks.append("GROWTH_REVERSAL")

    # Check last 2 velocity intervals for consecutive decline
    if len(timeline) >= 3:
        last3_h = [t["heightVelocity"] for t in timeline[-3:]]
        if all(v < 0.1 for v in last3_h):
            risks.append("GROWTH_STAGNATION")

    drift_dir = percentile_drift.get("direction", "STABLE")
    drift_mag = percentile_drift.get("magnitude", 0)
    if drift_dir == "DECLINING" and drift_mag >= 10:
        risks.append("SIGNIFICANT_PERCENTILE_DROP")
    elif drift_dir == "DECLINING" and drift_mag >= 5:
        risks.append("MILD_PERCENTILE_DROP")

    if w_status == "RAPID_ACCELERATING":
        risks.append("RAPID_WEIGHT_GAIN")

    return list(set(risks))


# ─── SCORES ───────────────────────────────────────────────────────────────────

def _compute_stability_score(timeline: List[Dict], h_ref: Dict, w_ref: Dict) -> int:
    """0–100: how consistently the child hits WHO velocity targets."""
    if not timeline:
        return 0

    h_hits = sum(
        1 for t in timeline
        if abs(t["heightVelocity"] - h_ref["expected"]) <= h_ref["sd"]
    )
    w_hits = sum(
        1 for t in timeline
        if abs(t["weightVelocity"] - w_ref["expected"]) <= w_ref["sd"]
    )
    n = len(timeline)
    score = int(((h_hits + w_hits) / (2 * n)) * 100)
    return max(0, min(100, score))


def _compute_risk_score(
    risks: List[str], h_status: str, w_status: str, b_status: str,
    percentile_drift: Dict
) -> int:
    """0–100: clinical risk level (0 = no risk, 100 = critical)."""
    score = 0

    high_risk = {"HEIGHT_PLATEAU", "WEIGHT_PLATEAU", "GROWTH_REVERSAL",
                 "UNEXPECTED_WEIGHT_DROP", "SIGNIFICANT_PERCENTILE_DROP"}
    medium_risk = {"BMI_SPIKE", "GROWTH_STAGNATION", "MILD_PERCENTILE_DROP",
                   "RAPID_WEIGHT_GAIN"}

    for r in risks:
        if r in high_risk:
            score += 20
        elif r in medium_risk:
            score += 10

    # Status penalties
    if h_status == "CRITICALLY_LOW":
        score += 15
    elif h_status == "BELOW_EXPECTED":
        score += 8

    if w_status == "CRITICALLY_LOW":
        score += 15
    elif w_status == "BELOW_EXPECTED":
        score += 8

    if b_status == "RAPID_ACCELERATING":
        score += 10

    drift_mag = percentile_drift.get("magnitude", 0)
    score += min(20, drift_mag * 1.5)

    return max(0, min(100, int(score)))


# ─── PERCENTILE DRIFT ──────────────────────────────────────────────────────────

def _compute_percentile_drift(percentile_history: List[float]) -> Dict:
    if len(percentile_history) < 2:
        return {"current": None, "previous": None, "direction": "STABLE",
                "magnitude": 0, "insight": "Insufficient records for percentile drift analysis"}

    current = percentile_history[-1]
    previous = percentile_history[-2]
    magnitude = round(abs(current - previous), 1)

    if current < previous - 3:
        direction = "DECLINING"
        insight = f"Downward percentile drift of {magnitude} points detected — was {previous:.0f}th, now {current:.0f}th percentile"
    elif current > previous + 3:
        direction = "RISING"
        insight = f"Upward percentile drift of {magnitude} points — healthy catch-up growth pattern"
    else:
        direction = "STABLE"
        insight = f"Percentile stable at {current:.0f}th — growth trajectory is consistent"

    # Longer trend if data available
    if len(percentile_history) >= 4:
        oldest = percentile_history[0]
        total_drift = current - oldest
        if abs(total_drift) > 10:
            trend = "declining" if total_drift < 0 else "rising"
            insight += f". Long-term trend: {trend} {abs(total_drift):.0f} points from baseline."

    return {
        "current": current,
        "previous": previous,
        "direction": direction,
        "magnitude": magnitude,
        "insight": insight,
        "history": [round(p, 1) for p in percentile_history],
    }


# ─── AI INSIGHTS (Deterministic Clinical NLG) ──────────────────────────────────

def _generate_insights(
    avg_h: float, avg_w: float, avg_b: float,
    h_status: str, w_status: str, b_status: str,
    h_ref: Dict, w_ref: Dict,
    percentile_drift: Dict,
    risks: List[str],
    age_months: int, gender: str, record_count: int
) -> List[str]:
    insights = []
    age_yrs = age_months // 12

    # Height velocity insight
    if h_status == "HEALTHY" or h_status == "ABOVE_EXPECTED":
        insights.append(
            f"Height growth velocity ({avg_h:.2f} cm/month) is within or above expected range "
            f"for a {age_yrs}-year-old — linear growth trajectory is healthy."
        )
    elif h_status in ("BELOW_EXPECTED", "CRITICALLY_LOW"):
        diff = h_ref["expected"] - avg_h
        insights.append(
            f"Height gain velocity ({avg_h:.2f} cm/month) is {diff:.2f} cm/month below "
            f"the WHO reference of {h_ref['expected']} cm/month. Growth monitoring recommended."
        )
    elif h_status == "SLIGHTLY_BELOW":
        insights.append(
            f"Height growth is slightly below expected ({avg_h:.2f} vs {h_ref['expected']} cm/month). "
            f"No immediate concern, but continue monitoring at next visit."
        )

    # Weight velocity insight
    if w_status == "HEALTHY":
        insights.append(
            f"Weight gain ({avg_w:.2f} kg/month) is progressing normally per WHO standards."
        )
    elif w_status in ("BELOW_EXPECTED", "CRITICALLY_LOW"):
        insights.append(
            f"Weight gain has slowed ({avg_w:.2f} kg/month vs expected {w_ref['expected']} kg/month). "
            f"Consider dietary evaluation and caloric intake review."
        )
    elif w_status == "RAPID_ACCELERATING":
        insights.append(
            f"Weight gain velocity ({avg_w:.2f} kg/month) is above expected. "
            f"Monitor for excess adiposity — review diet composition and activity levels."
        )
    elif avg_w < 0:
        insights.append(
            f"⚠️ Unexpected weight loss detected ({avg_w:.2f} kg/month). "
            f"Clinical evaluation recommended to rule out illness or nutritional deficiency."
        )

    # BMI velocity insight
    if b_status == "RAPID_ACCELERATING":
        insights.append(
            f"BMI is increasing faster than expected ({avg_b:.2f} BMI units/month). "
            f"Review energy-dense food intake and sedentary activity patterns."
        )
    elif b_status == "HEALTHY":
        insights.append("BMI growth velocity is within healthy bounds for this age group.")

    # Percentile drift
    drift_insight = percentile_drift.get("insight")
    if drift_insight:
        insights.append(drift_insight)

    # Specific risk insights
    if "GROWTH_STAGNATION" in risks:
        insights.append(
            "Growth velocity has been consistently low over the last three measurement intervals. "
            "This pattern suggests possible growth stagnation — recommend comprehensive review."
        )
    if "BMI_SPIKE" in risks:
        insights.append(
            "A rapid BMI acceleration has been detected. This warrants evaluation for "
            "early-onset overweight trajectory."
        )
    if "SIGNIFICANT_PERCENTILE_DROP" in risks:
        insights.append(
            "A significant drop in growth percentile has occurred. This is a key clinical flag — "
            "evaluate for chronic illness, nutritional deficiency, or psychosocial stress."
        )

    # Positive reinforcement if all healthy
    if not risks and h_status == "HEALTHY" and w_status == "HEALTHY":
        insights.append(
            f"Overall growth trajectory is excellent based on {record_count} measurements. "
            f"The child is growing consistently within healthy WHO reference bands."
        )

    return insights[:6]  # Cap to 6 insights for UI clarity


def _generate_recommendations(
    risks: List[str], h_status: str, w_status: str, b_status: str, age_months: int
) -> List[str]:
    recs = []

    if "HEIGHT_PLATEAU" in risks or h_status == "CRITICALLY_LOW":
        recs.append("Evaluate for growth hormone deficiency or chronic nutritional deficiency")
        recs.append("Bone age X-ray may be indicated to assess skeletal maturity")

    if "WEIGHT_PLATEAU" in risks or w_status in ("BELOW_EXPECTED", "CRITICALLY_LOW"):
        recs.append("Review 3-day dietary recall — assess caloric and protein adequacy")
        recs.append("Check for malabsorption symptoms: loose stools, bloating, food aversions")

    if "BMI_SPIKE" in risks or "RAPID_WEIGHT_GAIN" in risks:
        recs.append("Reduce ultra-processed food and liquid calorie consumption")
        recs.append("Increase structured physical activity to ≥60 min/day")

    if "UNEXPECTED_WEIGHT_DROP" in risks:
        recs.append("Urgent: rule out acute illness, infections, or GI disorders")
        recs.append("Order CBC, serum albumin, and thyroid function tests")

    if "GROWTH_STAGNATION" in risks:
        recs.append("Refer to pediatric endocrinologist for growth assessment")

    if "SIGNIFICANT_PERCENTILE_DROP" in risks:
        recs.append("Schedule comprehensive growth assessment within 2–4 weeks")
        recs.append("Consider pediatric gastroenterology referral if dietary changes insufficient")

    if not recs:
        recs.append("Continue current monitoring schedule — next measurement in 4–6 weeks")
        recs.append("Maintain balanced diet with adequate protein and micronutrient diversity")

    return recs[:5]


# ─── WHO BAND CHART DATA ───────────────────────────────────────────────────────

def _generate_who_bands_for_chart(records: List[Dict], gender: str) -> Dict:
    """
    Generate WHO height and weight reference bands for the chart date range.
    Uses simplified linear interpolation between WHO growth standards.
    """
    if not records:
        return {}

    # WHO height for age (simplified, cm at age in months for 50th percentile boys)
    # Based on WHO Growth Standards tables (approximate)
    who_height_50th_male = {
        24: 87.1, 36: 96.1, 48: 103.3, 60: 110.0,
        72: 116.0, 84: 121.7, 96: 127.0, 108: 132.2,
        120: 137.5, 132: 142.5, 144: 147.5
    }
    who_height_50th_female = {
        24: 85.7, 36: 95.1, 48: 102.7, 60: 109.4,
        72: 115.5, 84: 121.1, 96: 126.6, 108: 132.4,
        120: 138.3, 132: 144.0, 144: 149.0
    }

    table = who_height_50th_male if gender == "male" else who_height_50th_female

    # For chart simplicity, return reference lines at key ages
    ref_points = sorted(table.items())
    return {
        "heightReference50th": [
            {"ageMonths": age, "height50th": h} for age, h in ref_points
        ],
        "note": "WHO 50th percentile height reference (gender-adjusted)"
    }


# ─── INSUFFICIENT DATA FALLBACK ────────────────────────────────────────────────

def _insufficient_data_response(records: List[Dict], profile: Dict, age_months: int) -> Dict:
    record_data = []
    for r in records:
        ts = r.get("_parsedDate") or _parse_date(r.get("timestamp") or r.get("createdAt"))
        if ts:
            record_data.append({
                "date": ts.strftime("%Y-%m-%d"),
                "height": r.get("height"),
                "weight": r.get("weight"),
                "bmi": r.get("bmi"),
                "percentile": r.get("percentile"),
            })
    return {
        "profileId": str(profile.get("_id") or profile.get("profileId") or ""),
        "computedAt": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "recordCount": len(records),
        "insufficientData": True,
        "insufficientDataReason": (
            "At least 2 growth records with timestamps are required to compute velocity. "
            f"Currently have {len(records)} valid record(s)."
        ),
        "growthTimeline": record_data,
        "velocityMetrics": {},
        "velocityTimeline": [],
        "whoBands": {},
        "percentileDrift": {"direction": "STABLE", "magnitude": 0, "insight": "Insufficient data"},
        "stabilityScore": 0,
        "riskScore": 0,
        "riskIndicators": [],
        "insights": [
            f"Only {len(records)} growth record(s) found. "
            "Please add at least 2 measurements to enable velocity analysis."
        ],
        "recommendations": ["Record growth measurements monthly for accurate velocity tracking"],
    }
