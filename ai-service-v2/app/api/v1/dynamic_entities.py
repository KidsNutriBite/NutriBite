from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query
from app.schemas.dynamic_entity import (
    DynamicEntityCreate,
    DynamicEntityUpdate,
    DynamicEntityLifecycleUpdate,
    DynamicEntityResponse,
    DynamicEntityListResponse,
    DynamicEntitySeedResponse,
    EntityLifecycleStatus,
    DiscoveryThresholds,
    DiscoverySummaryResponse,
    DynamicCandidate,
    DiscoveryMethod
)
from app.services.dynamic_entity_service import dynamic_entity_service
from app.services.candidate_discovery_service import candidate_discovery_engine
from app.utils.logger import logger

router = APIRouter(prefix="/entities", tags=["Dynamic Entity Registry"])


@router.post(
    "",
    response_model=DynamicEntityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Propose and register a new dynamic entity"
)
async def create_dynamic_entity(payload: DynamicEntityCreate):
    """
    Proposes a new dynamic entity for the NutriBite NER registry.
    
    - Validates against name collisions with the frozen 10-Entity baseline.
    - Initial status is typically `PROPOSED`.
    - Initializes lifecycle tracking history.
    """
    try:
        return dynamic_entity_service.create_entity(payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating dynamic entity: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create entity.")


@router.get(
    "",
    response_model=DynamicEntityListResponse,
    summary="List all dynamic entities with filtering"
)
async def list_dynamic_entities(
    status: Optional[EntityLifecycleStatus] = Query(None, description="Filter by lifecycle status"),
    category: Optional[str] = Query(None, description="Filter by category substring"),
    schema_version: Optional[str] = Query(None, description="Filter by schema version (e.g. 2.1.0)"),
    search: Optional[str] = Query(None, description="Search keyword in name, aliases, or description")
):
    """
    Retrieves all registered dynamic entities with optional status, category, and keyword filters.
    """
    return dynamic_entity_service.list_entities(
        status=status.value if status else None,
        category=category,
        schema_version=schema_version,
        search=search
    )


@router.post(
    "/seed-defaults",
    response_model=DynamicEntitySeedResponse,
    summary="Seed Phase 1 selected entities (COOKING_METHOD, SUPPLEMENT, DIET_PATTERN)"
)
async def seed_default_entities():
    """
    Populates the registry with the Phase 1 empirical audit selections:
    - **COOKING_METHOD** (Primary Top-Tier - ACTIVE)
    - **SUPPLEMENT** (Primary Top-Tier - ACTIVE)
    - **DIET_PATTERN** (Alternative Candidate - VALIDATED)
    """
    seeded = dynamic_entity_service.seed_phase1_defaults()
    active_cnt = sum(1 for e in seeded if e.status == EntityLifecycleStatus.ACTIVE)
    return DynamicEntitySeedResponse(
        message="Phase 1 dynamic entities seeded successfully.",
        seeded_entities=[e.name for e in seeded],
        total_active=active_cnt
    )


@router.post(
    "/discover",
    response_model=DiscoverySummaryResponse,
    summary="Trigger dynamic NER candidate discovery over RAG corpus"
)
async def discover_candidates(
    thresholds: Optional[DiscoveryThresholds] = None,
    entities: Optional[List[str]] = Query(None, description="Specific dynamic entity names to scan for (e.g. COOKING_METHOD)"),
    persist: bool = Query(True, description="Write candidates to datasets/dynamic_candidates.json (never NER gold files)")
):
    """
    Executes the 3-tier Candidate Discovery Engine over the NutriBite RAG corpus:

    1. **Exact / Alias matching**
    2. **Fuzzy lexical matching**
    3. **Sentence Transformer embedding similarity** (reuses `intfloat/e5-small-v2`)

    Returns deduplicated and confidence-ranked candidate mentions.
    Candidates are stored separately from frozen NER training/gold data.
    """
    try:
        return candidate_discovery_engine.run_discovery_pipeline(
            entity_names=entities,
            thresholds=thresholds,
            persist=persist
        )
    except Exception as e:
        logger.error(f"Error executing candidate discovery pipeline: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Discovery failed: {str(e)}")


@router.get(
    "/{entity_name_or_id}",
    response_model=DynamicEntityResponse,
    summary="Get dynamic entity details"
)
async def get_dynamic_entity(entity_name_or_id: str):
    """
    Fetches a dynamic entity by its unique uppercase name (e.g. `COOKING_METHOD`) or database UUID.
    """
    entity = dynamic_entity_service.get_entity(entity_name_or_id)
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dynamic entity '{entity_name_or_id}' not found in registry."
        )
    return entity


@router.put(
    "/{entity_name_or_id}",
    response_model=DynamicEntityResponse,
    summary="Update dynamic entity attributes"
)
async def update_dynamic_entity(entity_name_or_id: str, payload: DynamicEntityUpdate):
    """
    Updates description, aliases, seed examples, precedence rank, or metadata for a dynamic entity.
    """
    try:
        return dynamic_entity_service.update_entity(entity_name_or_id, payload)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating dynamic entity {entity_name_or_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch(
    "/{entity_name_or_id}/lifecycle",
    response_model=DynamicEntityResponse,
    summary="Transition entity lifecycle state"
)
async def transition_entity_lifecycle(
    entity_name_or_id: str,
    payload: DynamicEntityLifecycleUpdate
):
    """
    Transitions the entity through its lifecycle stages:
    
    `PROPOSED` → `REVIEW` → `VALIDATED` → `TRAINING` → `EVALUATED` → `ACTIVE`
    
    - Validates permitted transition pathways.
    - Records audit history trail with timestamp, actor, and rationale.
    - Allows `force=True` for admin overrides.
    """
    try:
        return dynamic_entity_service.transition_lifecycle(entity_name_or_id, payload)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error transitioning lifecycle for {entity_name_or_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete(
    "/{entity_name_or_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete or deregister dynamic entity"
)
async def delete_dynamic_entity(entity_name_or_id: str):
    """
    Removes a dynamic entity from the registry.
    """
    try:
        dynamic_entity_service.delete_entity(entity_name_or_id)
        return None
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting dynamic entity {entity_name_or_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

