import time
import random
from typing import Dict, Any, List

def simulate_load(concurrent_users: int) -> Dict[str, Any]:
    """
    Simulates load profiles under various concurrent user thresholds.
    Returns transaction statistics, latency profiles, and cost trends under scale.
    """
    # Baseline performance variables
    base_latency_ms = 85.0  # TF-IDF RAG & Planner baseline execution latency
    llm_api_latency_ms = 1100.0  # Gemini API network roundtrip average latency
    
    # Scale degradation factor: more users, more CPU/DB contention
    contention_multiplier = 1.0 + (concurrent_users * 0.0008)
    
    # Calculate simulated stats
    avg_latency = round((base_latency_ms + llm_api_latency_ms) * contention_multiplier, 1)
    
    # Saturation threshold
    if concurrent_users <= 10:
        timeouts = 0
        cpu_usage = round(15.0 * contention_multiplier, 1)
        throughput = concurrent_users * 1.2
    elif concurrent_users <= 100:
        timeouts = int(concurrent_users * 0.01)
        cpu_usage = round(35.0 * contention_multiplier, 1)
        throughput = concurrent_users * 1.1
    elif concurrent_users <= 500:
        timeouts = int(concurrent_users * 0.03)
        cpu_usage = min(98.0, round(65.0 * contention_multiplier, 1))
        throughput = concurrent_users * 0.95
    else:
        # 1000 users
        timeouts = int(concurrent_users * 0.08)
        cpu_usage = 99.5
        throughput = concurrent_users * 0.8
        
    # Cost modeling
    tokens_per_request = 450
    cost_per_million_tokens = 0.075 # Gemini 1.5 Flash pricing
    cost_per_request = (tokens_per_request / 1000000.0) * cost_per_million_tokens
    total_cost = round(cost_per_request * concurrent_users * 10, 4) # cost for 10 queries per user
    
    return {
        "concurrent_users": concurrent_users,
        "average_latency_ms": avg_latency,
        "throughput_req_sec": round(throughput, 1),
        "cpu_utilization_pct": cpu_usage,
        "timeout_count": timeouts,
        "timeout_rate_pct": round((timeouts / concurrent_users) * 100, 2),
        "total_simulated_cost_usd": total_cost
    }

def run_stress_test_campaign() -> List[Dict[str, Any]]:
    campaign_results = []
    load_levels = [10, 50, 100, 500, 1000]
    
    for level in load_levels:
        stats = simulate_load(level)
        campaign_results.append(stats)
        
    return campaign_results

if __name__ == "__main__":
    campaign = run_stress_test_campaign()
    for res in campaign:
        print(f"Users: {res['concurrent_users']:4} | Latency: {res['average_latency_ms']:6.1f}ms | CPU: {res['cpu_utilization_pct']:5.1f}% | Timeouts: {res['timeout_count']:3}")
