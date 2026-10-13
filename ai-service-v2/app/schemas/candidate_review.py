from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ReviewDecision(str, Enum):
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    SKIPPED = "SKIPPED"


class RejectionReason(str, Enum):
    AMBIGUOUS_POLYSEMOUS = "AMBIGUOUS_POLYSEMOUS"
    WRONG_ENTITY_TYPE = "WRONG_ENTITY_TYPE"
    OUT_OF_DOMAIN = "OUT_OF_DOMAIN"
    SPAN_BOUNDARY_ERROR = "SPAN_BOUNDARY_ERROR"
    DUPLICATE = "DUPLICATE"
    OTHER = "OTHER"


class ReviewStatus(str, Enum):
    DISCOVERED = "DISCOVERED"
    PENDING_REVIEW = "PENDING_REVIEW"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    SKIPPED = "SKIPPED"


class CandidateReviewRequest(BaseModel):
    decision: ReviewDecision = Field(..., description="Reviewer decision: ACCEPTED, REJECTED, or SKIPPED")
    reviewer_id: str = Field("expert_reviewer", description="Identifier of the domain expert/admin reviewer")
    reviewer_note: Optional[str] = Field(None, description="Optional clinical/domain rationale for decision")
    rejection_reason: Optional[RejectionReason] = Field(
        None,
        description="Structured rejection reason if decision is REJECTED (e.g. AMBIGUOUS_POLYSEMOUS, WRONG_ENTITY_TYPE, OUT_OF_DOMAIN, SPAN_BOUNDARY_ERROR, DUPLICATE, OTHER)"
    )
    review_start_time: Optional[datetime] = Field(
        None,
        description="Timestamp when reviewer began evaluating this candidate/group"
    )
    review_end_time: Optional[datetime] = Field(
        None,
        description="Timestamp when reviewer completed and submitted decision"
    )
    review_duration_seconds: Optional[float] = Field(
        None,
        ge=0.0,
        description="Explicit elapsed review duration in seconds"
    )
    apply_to_all_occurrences: bool = Field(
        False, 
        description="If True, applies decision across all occurrences with identical candidate text and entity_id"
    )


class CandidateResponse(BaseModel):
    candidate_id: str = Field(..., description="Unique identifier for the candidate mention")
    entity_id: str = Field(..., description="Target dynamic entity category (e.g. COOKING_METHOD, SUPPLEMENT, DIET_PATTERN)")
    candidate_text: str = Field(..., description="Extracted surface text span")
    context: str = Field(..., description="Full source sentence or passage containing the candidate")
    source_document: str = Field(..., description="Source guideline document identifier")
    start_char: Optional[int] = Field(None, description="Character start offset in context")
    end_char: Optional[int] = Field(None, description="Character end offset in context")
    discovery_method: str = Field(..., description="Primary discovery method (exact_match, fuzzy_match, embedding_similarity)")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Confidence score [0.0 - 1.0]")
    discovered_by_methods: List[str] = Field(default_factory=list, description="All methods identifying this candidate")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata including match details and aliases")
    status: str = Field("DISCOVERED", description="Current review status")
    decision: Optional[str] = Field(None, description="Latest reviewer decision: ACCEPTED, REJECTED, or SKIPPED")
    rejection_reason: Optional[str] = Field(None, description="Structured rejection reason if rejected")
    reviewer_id: Optional[str] = Field(None, description="Reviewer ID who made the decision")
    reviewed_at: Optional[datetime] = Field(None, description="Timestamp of the review")
    reviewer_note: Optional[str] = Field(None, description="Reviewer rationale note")
    review_start_time: Optional[datetime] = Field(None, description="Start timestamp of review")
    review_end_time: Optional[datetime] = Field(None, description="End timestamp of review")
    review_duration_seconds: Optional[float] = Field(None, description="Elapsed review duration in seconds")
    occurrence_count: int = Field(1, description="Total corpus occurrences of this surface form for this entity")
    occurrences_covered: int = Field(1, description="Occurrences covered by the single review decision")
    duplicate_candidate_ids: List[str] = Field(default_factory=list, description="IDs of other occurrences of the same surface form")


class CandidateListResponse(BaseModel):
    total: int = Field(..., description="Total matching candidates")
    offset: int = Field(0, description="Offset used for pagination")
    limit: int = Field(50, description="Limit used for pagination")
    candidates: List[CandidateResponse] = Field(..., description="List of candidates")


class GroupReviewAnalytics(BaseModel):
    unique_surface_forms: int = Field(..., description="Total unique (entity_id, surface_form) groups")
    total_occurrences: int = Field(..., description="Total candidate mentions in corpus")
    reviewed_groups: int = Field(..., description="Distinct groups with recorded decisions")
    accepted_groups: int = Field(..., description="Groups clinically accepted")
    rejected_groups: int = Field(..., description="Groups rejected")
    skipped_groups: int = Field(..., description="Groups skipped / deferred")
    pending_groups: int = Field(..., description="Groups awaiting review")
    group_acceptance_rate: float = Field(..., description="Percentage of reviewed groups accepted")
    group_rejection_rate: float = Field(..., description="Percentage of reviewed groups rejected")
    occurrences_covered_by_accepted_groups: int = Field(..., description="Total occurrences resolved by accepted groups")
    occurrences_covered_by_rejected_groups: int = Field(..., description="Total occurrences resolved by rejected groups")
    occurrences_covered_by_skipped_groups: int = Field(..., description="Total occurrences in skipped groups")


class EffortMetrics(BaseModel):
    reviewed_candidate_count: int = Field(..., description="Total individual candidate mentions reviewed")
    reviewed_group_count: int = Field(..., description="Total unique groups reviewed")
    average_review_time_seconds: float = Field(..., description="Average seconds spent per review decision")
    total_review_effort_seconds: float = Field(..., description="Measured total reviewer active time in seconds")
    total_review_effort_minutes: float = Field(..., description="Measured total reviewer active time in minutes")
    estimated_individual_effort_seconds: float = Field(..., description="Estimated effort if all occurrences were triaged individually")
    estimated_individual_effort_minutes: float = Field(..., description="Estimated individual effort in minutes")
    effort_reduction_percentage: float = Field(..., description="Percentage reduction in annotation effort achieved by grouped review")
    candidate_coverage_percentage: float = Field(..., description="Percentage of candidate mentions reviewed")
    group_coverage_percentage: float = Field(..., description="Percentage of unique groups reviewed")


class EmbeddingThresholdEvaluation(BaseModel):
    threshold: float = Field(..., description="Embedding cosine similarity cut-off")
    total_matching_candidates: int = Field(..., description="Candidates with similarity_score >= threshold")
    coverage_percentage: float = Field(..., description="Percentage of all embedding candidates meeting threshold")
    reviewed_candidates: int = Field(..., description="Reviewed candidates meeting threshold")
    accepted_candidates: int = Field(..., description="Accepted candidates meeting threshold")
    acceptance_rate: float = Field(..., description="Acceptance rate (precision proxy) at this threshold")


class EmbeddingAnalysisResponse(BaseModel):
    total_embedding_candidates: int = Field(..., description="Total candidates discovered via dense embeddings")
    reviewed_embedding_candidates: int = Field(..., description="Total embedding candidates with review verdicts")
    accepted_embedding_candidates: int = Field(..., description="Accepted embedding candidates")
    current_acceptance_rate: float = Field(..., description="Acceptance rate for embedding candidates (e.g. 2.44%)")
    boundary_flaw_count: int = Field(..., description="Embedding candidates with leading/trailing stopword boundary flaws")
    boundary_flaw_percentage: float = Field(..., description="Percentage of embedding candidates with boundary flaws")
    threshold_evaluations: List[EmbeddingThresholdEvaluation] = Field(default_factory=list, description="Precision/coverage trade-off per threshold")
    root_cause_summary: str = Field(..., description="Detailed explanation of why embedding candidates exhibit low acceptance")
    recommendations: List[str] = Field(default_factory=list, description="Recommended architectural enhancements for Phase 10 / future candidate generation")


class ReviewSummaryResponse(BaseModel):
    total_candidates: int = Field(..., description="Total candidates in registry")
    reviewed_count: int = Field(..., description="Candidates that have been reviewed (accepted, rejected, or skipped)")
    pending_count: int = Field(..., description="Candidates awaiting review")
    accepted_count: int = Field(..., description="Candidates accepted")
    rejected_count: int = Field(..., description="Candidates rejected")
    skipped_count: int = Field(..., description="Candidates skipped")
    acceptance_rate: float = Field(..., description="Percentage of reviewed candidates accepted")
    rejection_rate: float = Field(0.0, description="Percentage of reviewed candidates rejected")
    candidates_per_entity: Dict[str, Dict[str, int]] = Field(
        default_factory=dict, 
        description="Candidate breakdown per entity with status counts"
    )
    candidates_per_discovery_method: Dict[str, Dict[str, int]] = Field(
        default_factory=dict,
        description="Candidate breakdown per discovery method with status counts"
    )
    confidence_distribution: Dict[str, int] = Field(
        default_factory=dict,
        description="Count of candidates in confidence bins"
    )
    unique_surface_forms_count: int = Field(..., description="Number of unique surface terms")
    validated_dataset_path: str = Field(..., description="Path to validated candidate dataset file")
    group_analytics: Optional[GroupReviewAnalytics] = Field(None, description="Group-level deduplication analytics")
    effort_metrics: Optional[EffortMetrics] = Field(None, description="Annotation effort metrics and reduction rates")
    rejection_reasons_breakdown: Dict[str, int] = Field(default_factory=dict, description="Distribution of structured rejection reasons")
    embedding_analysis: Optional[EmbeddingAnalysisResponse] = Field(None, description="Embedding candidate precision/coverage evaluation")


class ReviewActionResponse(BaseModel):
    message: str
    primary_candidate: CandidateResponse
    affected_count: int = 1
    affected_candidate_ids: List[str] = Field(default_factory=list)
    rejection_reason: Optional[str] = None
    review_duration_seconds: Optional[float] = None
    occurrences_covered: int = 1
