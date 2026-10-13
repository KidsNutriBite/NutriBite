from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from app.schemas.dynamic_entity import (
    EntityLifecycleStatus,
    DynamicEntityCreate,
    DynamicEntityUpdate,
    DynamicEntityLifecycleUpdate,
    DynamicEntityResponse,
    DynamicEntityListResponse,
    SeedExample,
    LifecycleHistoryEntry
)
from app.db.dynamic_entity_repo import dynamic_entity_repo
from app.utils.logger import logger

# Frozen 10-Entity Baseline Schema (Schema v2.0)
FROZEN_10_ENTITIES = {
    "NUTRIENT",
    "FOOD",
    "FOOD_GROUP",
    "DIETARY_PROPERTY",
    "FEEDING_METHOD",
    "HEALTH_CONDITION",
    "ALLERGEN",
    "AGE_GROUP",
    "MEAL_TYPE",
    "GROWTH_METRIC"
}

# Permitted state transitions in the Dynamic Entity Lifecycle:
# PROPOSED -> REVIEW -> VALIDATED -> TRAINING -> EVALUATED -> ACTIVE
LIFECYCLE_TRANSITIONS: Dict[EntityLifecycleStatus, List[EntityLifecycleStatus]] = {
    EntityLifecycleStatus.PROPOSED: [
        EntityLifecycleStatus.REVIEW,
        EntityLifecycleStatus.REJECTED
    ],
    EntityLifecycleStatus.REVIEW: [
        EntityLifecycleStatus.VALIDATED,
        EntityLifecycleStatus.PROPOSED,
        EntityLifecycleStatus.REJECTED
    ],
    EntityLifecycleStatus.VALIDATED: [
        EntityLifecycleStatus.TRAINING,
        EntityLifecycleStatus.REVIEW,
        EntityLifecycleStatus.REJECTED
    ],
    EntityLifecycleStatus.TRAINING: [
        EntityLifecycleStatus.EVALUATED,
        EntityLifecycleStatus.VALIDATED,
        EntityLifecycleStatus.REJECTED
    ],
    EntityLifecycleStatus.EVALUATED: [
        EntityLifecycleStatus.ACTIVE,
        EntityLifecycleStatus.TRAINING,
        EntityLifecycleStatus.REJECTED
    ],
    EntityLifecycleStatus.ACTIVE: [
        EntityLifecycleStatus.DEPRECATED,
        EntityLifecycleStatus.REVIEW
    ],
    EntityLifecycleStatus.DEPRECATED: [
        EntityLifecycleStatus.REVIEW,
        EntityLifecycleStatus.ACTIVE
    ],
    EntityLifecycleStatus.REJECTED: [
        EntityLifecycleStatus.PROPOSED
    ]
}


class DynamicEntityService:
    def __init__(self, repo=dynamic_entity_repo):
        self.repo = repo

    def create_entity(self, payload: DynamicEntityCreate) -> DynamicEntityResponse:
        name = payload.name.strip().upper()

        # Rule 1: Collision check with frozen 10-entity schema
        if name in FROZEN_10_ENTITIES:
            raise ValueError(
                f"Cannot register '{name}' as dynamic entity: '{name}' is already a frozen core entity in the 10-Entity Schema v2.0."
            )

        # Rule 2: Uniqueness check
        existing = self.repo.get_by_name(name)
        if existing:
            raise ValueError(f"Dynamic entity '{name}' already exists in the registry.")

        entity_dict = payload.model_dump()
        entity_dict["name"] = name
        entity_dict["status"] = entity_dict.get("status") or EntityLifecycleStatus.PROPOSED.value

        # Initialize lifecycle history
        initial_history = [
            {
                "from_status": EntityLifecycleStatus.PROPOSED.value,
                "to_status": entity_dict["status"],
                "changed_by": "SYSTEM",
                "reason": "Initial entity registration in registry",
                "timestamp": datetime.utcnow().isoformat()
            }
        ]
        entity_dict["lifecycle_history"] = initial_history

        created = self.repo.create(entity_dict)
        return DynamicEntityResponse(**created)

    def get_entity(self, identifier: str) -> Optional[DynamicEntityResponse]:
        doc = self.repo.get_by_id_or_name(identifier)
        if not doc:
            return None
        return DynamicEntityResponse(**doc)

    def list_entities(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        schema_version: Optional[str] = None,
        search: Optional[str] = None
    ) -> DynamicEntityListResponse:
        docs = self.repo.list_entities(
            status=status,
            category=category,
            schema_version=schema_version,
            search=search
        )
        entities = [DynamicEntityResponse(**d) for d in docs]
        active_count = sum(1 for e in entities if e.status == EntityLifecycleStatus.ACTIVE)
        pending_review_count = sum(
            1 for e in entities if e.status in [EntityLifecycleStatus.PROPOSED, EntityLifecycleStatus.REVIEW]
        )

        return DynamicEntityListResponse(
            total=len(entities),
            entities=entities,
            schema_version="2.1.0",
            active_count=active_count,
            pending_review_count=pending_review_count
        )

    def update_entity(self, identifier: str, payload: DynamicEntityUpdate) -> DynamicEntityResponse:
        existing = self.repo.get_by_id_or_name(identifier)
        if not existing:
            raise KeyError(f"Dynamic entity '{identifier}' not found.")

        update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        if "seed_examples" in update_data:
            # Convert models to dicts
            update_data["seed_examples"] = [s if isinstance(s, dict) else s.model_dump() for s in update_data["seed_examples"]]

        updated = self.repo.update(existing["name"], update_data)
        return DynamicEntityResponse(**updated)

    def transition_lifecycle(
        self,
        identifier: str,
        payload: DynamicEntityLifecycleUpdate
    ) -> DynamicEntityResponse:
        existing = self.repo.get_by_id_or_name(identifier)
        if not existing:
            raise KeyError(f"Dynamic entity '{identifier}' not found.")

        current_status = EntityLifecycleStatus(existing.get("status", EntityLifecycleStatus.PROPOSED.value))
        target_status = payload.target_status

        if current_status == target_status:
            return DynamicEntityResponse(**existing)

        # Validate lifecycle progression
        allowed_next = LIFECYCLE_TRANSITIONS.get(current_status, [])
        if not payload.force and target_status not in allowed_next:
            valid_targets = ", ".join([s.value for s in allowed_next])
            raise ValueError(
                f"Invalid lifecycle transition: Cannot jump from {current_status.value} to {target_status.value}. "
                f"Valid next states: [{valid_targets}]. Use force=True for admin override."
            )

        history = existing.get("lifecycle_history", [])
        history_entry = {
            "from_status": current_status.value,
            "to_status": target_status.value,
            "changed_by": payload.changed_by,
            "reason": payload.reason or f"Transitioned from {current_status.value} to {target_status.value}",
            "timestamp": datetime.utcnow().isoformat()
        }
        history.append(history_entry)

        updated = self.repo.update(
            existing["name"],
            {
                "status": target_status.value,
                "lifecycle_history": history
            }
        )
        return DynamicEntityResponse(**updated)

    def delete_entity(self, identifier: str) -> bool:
        existing = self.repo.get_by_id_or_name(identifier)
        if not existing:
            raise KeyError(f"Dynamic entity '{identifier}' not found.")
        return self.repo.delete(existing["name"])

    def seed_phase1_defaults(self) -> List[DynamicEntityResponse]:
        """
        Seeds the registry with the Phase 1 audit selected entities:
        - COOKING_METHOD (Primary Recommendation #1 - Status: ACTIVE)
        - SUPPLEMENT (Primary Recommendation #2 - Status: ACTIVE)
        - DIET_PATTERN (Alternative Candidate #3 - Status: VALIDATED)
        """
        default_entities = [
            {
                "name": "COOKING_METHOD",
                "display_name": "Cooking Method",
                "category": "Culinary & Biochemical Processing",
                "description": "Thermal, mechanical, or biochemical food preparation methods that modulate micronutrient bioavailability, anti-nutrient degradation (phytates, tannins), and infant textural suitability.",
                "aliases": [
                    "steaming", "steamed", "boiling", "boiled", "roasting", "roasted",
                    "pressure cooking", "fermentation", "fermented", "sprouting", "sprouted",
                    "germination", "mashing", "mashed", "pureeing", "pureed", "blanching",
                    "sauteing", "soaking", "shallow frying", "baking", "stewing"
                ],
                "seed_examples": [
                    {
                        "text": "Sprouting and fermenting pulses enhances iron and zinc bioavailability in infant porridges.",
                        "surface_span": "Sprouting",
                        "start_char": 0,
                        "end_char": 9,
                        "source_context": "RAG_PREPARATION_GUIDELINE_12",
                        "clinical_notes": "Degrades phytates bound to dietary iron."
                    },
                    {
                        "text": "Provide steamed and mashed vegetables during early complementary feeding to prevent choking.",
                        "surface_span": "steamed",
                        "start_char": 8,
                        "end_char": 15,
                        "source_context": "RAG_WEANING_SAFETY_4",
                        "clinical_notes": "Age-appropriate texture modification."
                    },
                    {
                        "text": "Boiled eggs and pressure cooked lentils are easy for toddlers to digest.",
                        "surface_span": "Boiled",
                        "start_char": 0,
                        "end_char": 6,
                        "source_context": "RAG_PROTEIN_ABSORPTION_8",
                        "clinical_notes": "Thermal denaturation improving protein bioavailability."
                    }
                ],
                "schema_version": "2.1.0",
                "status": EntityLifecycleStatus.ACTIVE.value,
                "precedence_rank": 45,
                "downstream_rag_use": "Anti-nutrient reduction guidelines, bio-availability optimization, and weaning texture safety.",
                "metadata": {
                    "phase1_mentions": 207,
                    "phase1_sentences": 141,
                    "phase1_docs": 112,
                    "phase1_recommendation_tier": "Top Tier (Rank 1)",
                    "audit_source": "phase1_entity_audit.csv"
                }
            },
            {
                "name": "SUPPLEMENT",
                "display_name": "Nutritional Supplement",
                "category": "Clinical & Pharmaceutical Formulations",
                "description": "Exogenous pharmaceutical or clinical therapeutic micronutrient preparations, drops, syrups, tablets, and therapeutic foods prescribed for prevention or treatment of pediatric malnutrition.",
                "aliases": [
                    "iron drops", "iron syrup", "ifa tablets", "ifa syrup", "vitamin d drops",
                    "zinc supplementation", "zinc syrup", "zinc tablets", "ors",
                    "oral rehydration salts", "rutf", "therapeutic food", "micronutrient powder",
                    "mnp", "multivitamin syrup", "calcium supplement", "deworming tablet"
                ],
                "seed_examples": [
                    {
                        "text": "Infants diagnosed with severe anemia require pediatric iron drops alongside vitamin C rich fruits.",
                        "surface_span": "iron drops",
                        "start_char": 44,
                        "end_char": 54,
                        "source_context": "RAG_ANEMIA_TREATMENT_2",
                        "clinical_notes": "Targeted pharmacological micronutrient posology."
                    },
                    {
                        "text": "Administer zinc supplementation and ORS solution immediately during acute pediatric diarrhea.",
                        "surface_span": "zinc supplementation",
                        "start_char": 11,
                        "end_char": 31,
                        "source_context": "RAG_DIARRHEA_PROTOCOL_1",
                        "clinical_notes": "WHO clinical protocol for pediatric diarrhea recovery."
                    },
                    {
                        "text": "Children with severe acute malnutrition are managed with ready-to-use therapeutic food (RUTF).",
                        "surface_span": "RUTF",
                        "start_char": 88,
                        "end_char": 92,
                        "source_context": "RAG_SAM_RECOVERY_5",
                        "clinical_notes": "Therapeutic lipid-based nutrient formulation."
                    }
                ],
                "schema_version": "2.1.0",
                "status": EntityLifecycleStatus.ACTIVE.value,
                "precedence_rank": 35,
                "downstream_rag_use": "Clinical dosage verification, posology safety alerts, and acute SAM/diarrhea management.",
                "metadata": {
                    "phase1_mentions": 31,
                    "phase1_sentences": 27,
                    "phase1_docs": 24,
                    "phase1_recommendation_tier": "Top Tier (Rank 2)",
                    "audit_source": "phase1_entity_audit.csv"
                }
            },
            {
                "name": "DIET_PATTERN",
                "display_name": "Dietary Pattern",
                "category": "Macro Nutritional Paradigms",
                "description": "Systemic dietary models, feeding regimens, and nutritional paradigms characterizing overall food intake variety and structure.",
                "aliases": [
                    "balanced diet", "dietary diversity", "diversified diet", "plant-based diet",
                    "vegetarian diet", "traditional diet", "complementary diet", "monotonous diet"
                ],
                "seed_examples": [
                    {
                        "text": "Achieving dietary diversity across at least five food groups daily prevents hidden hunger in toddlers.",
                        "surface_span": "dietary diversity",
                        "start_char": 10,
                        "end_char": 27,
                        "source_context": "RAG_MDD_GUIDELINE_3",
                        "clinical_notes": "WHO Minimum Dietary Diversity score metric."
                    },
                    {
                        "text": "A balanced diet containing all essential macro and micronutrients is vital during the first 1000 days.",
                        "surface_span": "balanced diet",
                        "start_char": 2,
                        "end_char": 15,
                        "source_context": "RAG_INTRO_1",
                        "clinical_notes": "Core holistic dietary principle."
                    }
                ],
                "schema_version": "2.1.0",
                "status": EntityLifecycleStatus.VALIDATED.value,
                "precedence_rank": 55,
                "downstream_rag_use": "Dietary diversity compliance scoring, meal plan balance evaluation.",
                "metadata": {
                    "phase1_mentions": 17,
                    "phase1_sentences": 17,
                    "phase1_docs": 12,
                    "phase1_recommendation_tier": "Alternative Candidate (Rank 3)",
                    "audit_source": "phase1_entity_audit.csv"
                }
            }
        ]

        seeded = []
        for def_data in default_entities:
            existing = self.repo.get_by_name(def_data["name"])
            if not existing:
                created = self.repo.create(def_data)
                seeded.append(DynamicEntityResponse(**created))
            else:
                seeded.append(DynamicEntityResponse(**existing))

        return seeded


# Global service instance
dynamic_entity_service = DynamicEntityService()
