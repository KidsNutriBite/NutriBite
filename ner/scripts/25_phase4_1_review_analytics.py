"""
Phase 4.1: Candidate Review Enhancement Analytics Runner
========================================================
Computes:
1. Annotation-effort tracking and metrics
2. Structured rejection reasons breakdown
3. Group-level review analytics
4. Research metrics (acceptance rate, rejection rate, effort reduction)
5. Dense embedding candidate precision/coverage evaluation
"""

import os
import sys
import json

base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ai_service_dir = os.path.join(base_dir, "ai-service-v2")
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

from app.services.candidate_review_service import candidate_review_service


def run_phase4_1_analytics():
    print("=" * 80)
    print("  NUTRIBITE PHASE 4.1 — CANDIDATE REVIEW ENHANCEMENT & RESEARCH METRICS")
    print("=" * 80)

    # Reload to ensure fresh state
    candidate_review_service.load_candidates(force_reload=True)
    summary = candidate_review_service.get_review_summary()

    print("\n1. GROUP-LEVEL REVIEW ANALYTICS")
    print("-" * 50)
    ga = summary.group_analytics
    print(f"  Unique Surface Forms (Groups):  {ga.unique_surface_forms}")
    print(f"  Total Occurrences (Mentions):   {ga.total_occurrences}")
    print(f"  Reviewed Groups:                {ga.reviewed_groups} ({ga.reviewed_groups / ga.unique_surface_forms * 100:.1f}%)")
    print(f"  Accepted Groups:                {ga.accepted_groups} (covers {ga.occurrences_covered_by_accepted_groups} occurrences)")
    print(f"  Rejected Groups:                {ga.rejected_groups} (covers {ga.occurrences_covered_by_rejected_groups} occurrences)")
    print(f"  Skipped Groups:                 {ga.skipped_groups} (covers {ga.occurrences_covered_by_skipped_groups} occurrences)")
    print(f"  Pending Groups:                 {ga.pending_groups}")
    print(f"  Group Acceptance Rate:          {ga.group_acceptance_rate:.2f}%")
    print(f"  Group Rejection Rate:           {ga.group_rejection_rate:.2f}%")

    print("\n2. ANNOTATION EFFORT & RESEARCH METRICS")
    print("-" * 50)
    em = summary.effort_metrics
    print(f"  Reviewed Candidates:            {em.reviewed_candidate_count}")
    print(f"  Reviewed Unique Groups:         {em.reviewed_group_count}")
    print(f"  Average Review Time:            {em.average_review_time_seconds:.1f} s/decision")
    print(f"  Total Active Review Effort:     {em.total_review_effort_seconds:.1f} s ({em.total_review_effort_minutes:.2f} mins)")
    print(f"  Est. Individual Effort:         {em.estimated_individual_effort_seconds:.1f} s ({em.estimated_individual_effort_minutes:.2f} mins)")
    print(f"  Effort Reduction via Grouping:  {em.effort_reduction_percentage:.2f}%")
    print(f"  Candidate Coverage:             {em.candidate_coverage_percentage:.2f}%")
    print(f"  Group Coverage:                 {em.group_coverage_percentage:.2f}%")

    print("\n3. STRUCTURED REJECTION REASONS BREAKDOWN")
    print("-" * 50)
    for reason, count in summary.rejection_reasons_breakdown.items():
        pct = (count / max(1, summary.rejected_count)) * 100.0
        print(f"  {reason:<25}: {count:>4} ({pct:>5.1f}%)")

    print("\n4. EMBEDDING-CANDIDATE ANALYSIS & THRESHOLD EVALUATION")
    print("-" * 50)
    ea = summary.embedding_analysis
    print(f"  Total Embedding Candidates:     {ea.total_embedding_candidates}")
    print(f"  Reviewed Embedding Candidates:  {ea.reviewed_embedding_candidates}")
    print(f"  Accepted Embedding Candidates:  {ea.accepted_embedding_candidates}")
    print(f"  Acceptance Rate (Precision):    {ea.current_acceptance_rate:.2f}%")
    print(f"  Syntactic Boundary Flaws:       {ea.boundary_flaw_count} ({ea.boundary_flaw_percentage:.2f}%)")

    print("\n  [Precision / Coverage Trade-Off by Threshold]")
    print(f"  {'Threshold':<12} {'Matching':<10} {'Coverage %':<12} {'Reviewed':<10} {'Accepted':<10} {'Precision %':<12}")
    for te in ea.threshold_evaluations:
        print(f"  >= {te.threshold:<9.2f} {te.total_matching_candidates:<10} {te.coverage_percentage:<12.1f} {te.reviewed_candidates:<10} {te.accepted_candidates:<10} {te.acceptance_rate:<12.2f}")

    print("\n  [Root Cause Diagnosis]")
    print(f"  {ea.root_cause_summary}")

    # Save machine-readable output
    out_path = os.path.join(base_dir, "ner", "reports", "phase4_1_analytics_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary.model_dump(mode="json"), f, indent=2, ensure_ascii=False)
    print(f"\nSaved JSON results to {out_path}")


if __name__ == "__main__":
    run_phase4_1_analytics()
