from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
import re


class EntityLifecycleStatus(str, Enum):
    PROPOSED = "PROPOSED"
    REVIEW = "REVIEW"
    VALIDATED = "VALIDATED"
    TRAINING = "TRAINING"
    EVALUATED = "EVALUATED"
    ACTIVE = "ACTIVE"
    DEPRECATED = "DEPRECATED"
    REJECTED = "REJECTED"


class SeedExample(BaseModel):
    text: str = Field(..., description="Full clinical guideline or query sentence containing the mention")
    surface_span: str = Field(..., description="Exact substring surface form of the entity span")
    start_char: Optional[int] = Field(None, description="0-indexed start character offset in text")
    end_char: Optional[int] = Field(None, description="0-indexed end character offset in text")
    source_context: str = Field("CLINICAL_GUIDELINE", description="Source passage identifier or domain context")
    clinical_notes: Optional[str] = Field("", description="Annotator notes or clinical rationale")


class LifecycleHistoryEntry(BaseModel):
    from_status: EntityLifecycleStatus
    to_status: EntityLifecycleStatus
    changed_by: str = Field("SYSTEM", description="User or automated worker performing the transition")
    reason: Optional[str] = Field("", description="Clinical or pipeline validation reason")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class DynamicEntityBase(BaseModel):
    name: str = Field(..., description="Unique uppercase identifier for the entity (e.g. COOKING_METHOD)")
    display_name: str = Field(..., description="Human-friendly label (e.g. Cooking Method)")
    category: str = Field(..., description="Domain classification (e.g. Culinary & Biochemical Processing)")
    description: str = Field(..., description="Detailed clinical and semantic definition")
    aliases: List[str] = Field(default_factory=list, description="List of synonymous surface terms or aliases")
    seed_examples: List[SeedExample] = Field(default_factory=list, description="Seed examples for few-shot learning and evaluation")
    schema_version: str = Field("2.1.0", description="Semantic schema version (e.g. 2.1.0)")
    status: EntityLifecycleStatus = Field(EntityLifecycleStatus.PROPOSED, description="Current lifecycle state")
    precedence_rank: int = Field(50, description="Precedence rank in flat sequence labeling hierarchy")
    downstream_rag_use: Optional[str] = Field("", description="Functional utility in RAG queries and guideline retrieval")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary audit metrics, empirical counts, and flags")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip().upper()
        if not re.match(r"^[A-Z0-9_]+$", cleaned):
            raise ValueError("Entity name must contain only uppercase alphanumeric characters and underscores.")
        if len(cleaned) < 2 or len(cleaned) > 50:
            raise ValueError("Entity name must be between 2 and 50 characters.")
        return cleaned


class DynamicEntityCreate(DynamicEntityBase):
    pass


class DynamicEntityUpdate(BaseModel):
    display_name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    aliases: Optional[List[str]] = None
    seed_examples: Optional[List[SeedExample]] = None
    schema_version: Optional[str] = None
    precedence_rank: Optional[int] = None
    downstream_rag_use: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class DynamicEntityLifecycleUpdate(BaseModel):
    target_status: EntityLifecycleStatus = Field(..., description="Target lifecycle state to transition to")
    changed_by: str = Field("ADMIN", description="Actor performing the state change")
    reason: Optional[str] = Field("", description="Justification or validation summary for the transition")
    force: bool = Field(False, description="Whether to bypass sequential lifecycle validation gates")


class DynamicEntityResponse(DynamicEntityBase):
    id: Optional[str] = Field(None, description="Unique database ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    lifecycle_history: List[LifecycleHistoryEntry] = Field(default_factory=list)


class DynamicEntityListResponse(BaseModel):
    total: int
    entities: List[DynamicEntityResponse]
    schema_version: str = "2.1.0"
    active_count: int
    pending_review_count: int


class DynamicEntitySeedResponse(BaseModel):
    message: str
    seeded_entities: List[str]
    total_active: int


class DiscoveryMethod(str, Enum):
    EXACT_MATCH = "exact_match"
    FUZZY_MATCH = "fuzzy_match"
    EMBEDDING_SIMILARITY = "embedding_similarity"


class CandidateStatus(str, Enum):
    DISCOVERED = "DISCOVERED"
    PENDING_REVIEW = "PENDING_REVIEW"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class DiscoveryThresholds(BaseModel):
    exact_threshold: float = Field(1.0, ge=0.0, le=1.0, description="Exact/alias match confidence threshold")
    fuzzy_threshold: float = Field(0.80, ge=0.0, le=1.0, description="Fuzzy lexical similarity threshold")
    embedding_threshold: float = Field(0.70, ge=0.0, le=1.0, description="Dense embedding cosine similarity threshold")
    sentence_threshold: float = Field(0.55, ge=0.0, le=1.0, description="Sentence-level E5 retrieval gate before span extraction")
    max_candidates_per_entity: int = Field(500, ge=1, le=5000, description="Maximum candidates to retain per entity")
    min_ngram: int = Field(1, ge=1, le=5, description="Minimum n-gram token length for candidate span extraction")
    max_ngram: int = Field(4, ge=1, le=8, description="Maximum n-gram token length for candidate span extraction")


class DynamicCandidate(BaseModel):
    candidate_id: str = Field(..., description="Unique candidate identifier")
    entity_id: str = Field(..., description="Target dynamic entity name (e.g. COOKING_METHOD)")
    candidate_text: str = Field(..., description="Extracted surface text span")
    start_char: Optional[int] = Field(None, description="0-indexed start character offset in context")
    end_char: Optional[int] = Field(None, description="0-indexed end character offset in context")
    context: str = Field(..., description="Full source sentence or context containing the candidate")
    source_document: str = Field(..., description="Source RAG document or retrieval query ID")
    discovery_method: DiscoveryMethod = Field(..., description="Primary discovery method yielding highest confidence")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Similarity or match confidence score [0.0 - 1.0]")
    status: CandidateStatus = Field(CandidateStatus.DISCOVERED, description="Current candidate review status")
    discovered_by_methods: List[str] = Field(default_factory=list, description="All methods that identified this mention")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Matched alias, raw metrics, or similarity breakdown")


class DiscoverySummaryResponse(BaseModel):
    total_raw_mentions: int
    total_unique_candidates: int
    duplicate_count: int
    capped_dropped_count: int = 0
    corpus_sentence_count: int = 0
    counts_by_entity: Dict[str, int]
    counts_by_method: Dict[str, int]
    confidence_distribution: Dict[str, int]
    thresholds_used: DiscoveryThresholds
    embedding_model: str = "intfloat/e5-small-v2"
    candidates: List[DynamicCandidate]

