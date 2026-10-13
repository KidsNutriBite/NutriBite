from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query
from app.schemas.candidate_review import (
    CandidateReviewRequest,
    CandidateResponse,
    CandidateListResponse,
    ReviewSummaryResponse,
    ReviewActionResponse,
    GroupReviewAnalytics,
    EffortMetrics,
    EmbeddingAnalysisResponse,
)
from app.services.candidate_review_service import candidate_review_service
from app.utils.logger import logger

router = APIRouter(prefix="/candidates", tags=["Candidate Review"])


@router.get(
    "/review-summary",
    response_model=ReviewSummaryResponse,
    summary="Get candidate review summary statistics"
)
async def get_review_summary():
    """
    Returns aggregate statistics on discovered candidates:
    - total, reviewed, pending, accepted, rejected, and skipped counts
    - acceptance rate and rejection rate percentages
    - breakdown by dynamic entity category
    - breakdown by discovery method
    - confidence score distribution
    - path to the validated candidate dataset
    - Phase 4.1 group analytics, effort metrics, rejection reasons, and embedding analysis
    """
    try:
        return candidate_review_service.get_review_summary()
    except Exception as e:
        logger.error(f"Error generating review summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate review summary: {str(e)}"
        )


@router.get(
    "/analytics/group-review",
    response_model=GroupReviewAnalytics,
    summary="Get group-level deduplication review analytics"
)
async def get_group_analytics():
    """
    Phase 4.1: Returns deduplication analytics across unique surface forms:
    - unique surface forms count
    - total occurrences count
    - reviewed, accepted, rejected, skipped, pending groups
    - occurrences covered by accepted/rejected/skipped groups
    - group acceptance and rejection rates
    """
    try:
        return candidate_review_service.get_group_analytics()
    except Exception as e:
        logger.error(f"Error generating group analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute group analytics: {str(e)}"
        )


@router.get(
    "/analytics/effort-metrics",
    response_model=EffortMetrics,
    summary="Get annotation-effort and reduction metrics"
)
async def get_effort_metrics(
    default_time_per_decision: float = Query(15.0, ge=1.0, le=300.0, description="Baseline seconds per review decision")
):
    """
    Phase 4.1: Calculates research-grade annotation-effort metrics:
    - reviewed candidate count and unique group count
    - average review time
    - total review effort (seconds and minutes)
    - estimated individual occurrence effort
    - effort reduction percentage achieved by grouped triage
    - candidate and group coverage percentages
    """
    try:
        return candidate_review_service.get_effort_metrics(default_time_per_decision=default_time_per_decision)
    except Exception as e:
        logger.error(f"Error calculating effort metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute effort metrics: {str(e)}"
        )


@router.get(
    "/analytics/embedding-thresholds",
    response_model=EmbeddingAnalysisResponse,
    summary="Get embedding candidate threshold evaluation and root cause analysis"
)
async def get_embedding_analysis():
    """
    Phase 4.1: Evaluates dense embedding candidates across similarity thresholds:
    - acceptance rate at each threshold ([0.80, 0.85, 0.90, 0.92, 0.95, 0.97])
    - precision vs. coverage trade-off
    - syntactic boundary flaw analysis (leading/trailing stopwords)
    - root cause diagnosis and recommendations for Phase 10
    """
    try:
        return candidate_review_service.get_embedding_analysis()
    except Exception as e:
        logger.error(f"Error evaluating embedding candidates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze embedding candidates: {str(e)}"
        )


@router.get(
    "",
    response_model=CandidateListResponse,
    summary="List discovered dynamic candidates with filtering"
)
async def list_candidates(
    entity: Optional[str] = Query(None, description="Filter by entity name (e.g. COOKING_METHOD, SUPPLEMENT, DIET_PATTERN)"),
    discovery_method: Optional[str] = Query(None, description="Filter by method (exact_match, fuzzy_match, embedding_similarity)"),
    min_confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum confidence score [0.0 - 1.0]"),
    max_confidence: Optional[float] = Query(None, ge=0.0, le=1.0, description="Maximum confidence score [0.0 - 1.0]"),
    review_status: Optional[str] = Query(None, description="Filter by status (PENDING, ACCEPTED, REJECTED, SKIPPED, DISCOVERED)"),
    search: Optional[str] = Query(None, description="Search term in candidate text or context"),
    group_by_surface_form: bool = Query(False, description="Deduplication mode: show only one entry per unique surface form"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=500, description="Pagination limit"),
):
    """
    Retrieves candidates discovered across the NutriBite RAG corpus.
    Supports filtering by dynamic entity, discovery method, confidence range,
    review status, and search query.
    """
    try:
        return candidate_review_service.list_candidates(
            entity=entity,
            discovery_method=discovery_method,
            min_confidence=min_confidence,
            max_confidence=max_confidence,
            review_status=review_status,
            search=search,
            group_by_surface_form=group_by_surface_form,
            offset=offset,
            limit=limit,
        )
    except Exception as e:
        logger.error(f"Error listing candidates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list candidates: {str(e)}"
        )


@router.get(
    "/{candidate_id}",
    response_model=CandidateResponse,
    summary="Get single candidate details by ID"
)
async def get_candidate(candidate_id: str):
    """
    Fetches full candidate details including context, character offsets,
    discovery metadata, occurrence count, and reviewer decisions.
    """
    candidate = candidate_review_service.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID '{candidate_id}' not found."
        )
    return candidate


@router.patch(
    "/{candidate_id}/review",
    response_model=ReviewActionResponse,
    summary="Submit human reviewer decision on a candidate"
)
async def review_candidate(
    candidate_id: str,
    payload: CandidateReviewRequest
):
    """
    Allows a clinical or administrative reviewer to:
    - **ACCEPTED**: Approve candidate for downstream few-shot training.
    - **REJECTED**: Reject false positives or irrelevant surface mentions.
    - **SKIPPED**: Defer decision for further clinical review.

    Supports `apply_to_all_occurrences` to propagate decisions across identical
    surface forms while preserving each occurrence's original ID and context.
    Accepted candidates are automatically synchronized to `validated_candidates.json`.
    """
    try:
        return candidate_review_service.review_candidate(candidate_id, payload)
    except KeyError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error reviewing candidate {candidate_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Review failed: {str(e)}"
        )
