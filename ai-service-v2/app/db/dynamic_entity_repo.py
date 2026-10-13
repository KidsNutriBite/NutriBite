import os
import json
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from pymongo import MongoClient, errors
from app.core.config import settings
from app.utils.logger import logger

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "datasets")
FALLBACK_JSON_PATH = os.path.join(DATASETS_DIR, "dynamic_entities.json")


class DynamicEntityRepository:
    def __init__(self):
        self._mongo_client: Optional[MongoClient] = None
        self._db = None
        self._collection = None
        self._init_mongo()

    def _init_mongo(self):
        try:
            self._mongo_client = MongoClient(
                settings.MONGO_URI,
                serverSelectionTimeoutMS=1500,
                connectTimeoutMS=1500
            )
            # Trigger server selection check
            self._mongo_client.admin.command('ping')
            self._db = self._mongo_client[settings.MONGO_DB_NAME]
            self._collection = self._db["dynamic_entities"]
            self._collection.create_index("name", unique=True)
            self._collection.create_index("status")
            if self._collection.count_documents({}) == 0:
                fallback_items = self._load_fallback()
                for item in fallback_items:
                    try:
                        doc = dict(item)
                        doc.pop("_id", None)
                        self._collection.insert_one(doc)
                    except Exception:
                        pass
            logger.info("DynamicEntityRepository connected to MongoDB successfully.")
        except Exception as e:
            logger.warning(f"MongoDB unavailable ({e}). DynamicEntityRepository will use JSON persistence at {FALLBACK_JSON_PATH}.")
            self._mongo_client = None
            self._db = None
            self._collection = None

    def _load_fallback(self) -> List[Dict[str, Any]]:
        if not os.path.exists(FALLBACK_JSON_PATH):
            return []
        try:
            with open(FALLBACK_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception as e:
            logger.error(f"Error loading fallback dynamic entities: {e}")
            return []

    def _save_fallback(self, entities: List[Dict[str, Any]]) -> bool:
        try:
            os.makedirs(os.path.dirname(FALLBACK_JSON_PATH), exist_ok=True)
            with open(FALLBACK_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(entities, f, indent=2, default=str, ensure_ascii=False)
            return True
        except Exception as e:
            logger.error(f"Error saving fallback dynamic entities: {e}")
            return False

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        name_clean = name.strip().upper()
        if self._collection is not None:
            try:
                doc = self._collection.find_one({"name": name_clean})
                if doc:
                    doc["id"] = str(doc.pop("_id", doc.get("id")))
                    return doc
                return None
            except Exception as e:
                logger.warning(f"MongoDB error on get_by_name, falling back: {e}")

        # Fallback
        for e in self._load_fallback():
            if e.get("name", "").upper() == name_clean:
                return e
        return None

    def get_by_id_or_name(self, identifier: str) -> Optional[Dict[str, Any]]:
        clean_id = identifier.strip()
        # First check name
        res = self.get_by_name(clean_id)
        if res:
            return res

        # Then check ID
        if self._collection is not None:
            try:
                from bson import ObjectId
                if ObjectId.is_valid(clean_id):
                    doc = self._collection.find_one({"_id": ObjectId(clean_id)})
                    if doc:
                        doc["id"] = str(doc.pop("_id"))
                        return doc
                else:
                    doc = self._collection.find_one({"id": clean_id})
                    if doc:
                        doc["id"] = str(doc.pop("_id", doc.get("id")))
                        return doc
                return None
            except Exception:
                pass

        for e in self._load_fallback():
            if e.get("id") == clean_id:
                return e
        return None

    def list_entities(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        schema_version: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        entities = []
        if self._collection is not None:
            try:
                query = {}
                if status:
                    query["status"] = status.upper()
                if category:
                    query["category"] = {"$regex": category, "$options": "i"}
                if schema_version:
                    query["schema_version"] = schema_version
                if search:
                    query["$or"] = [
                        {"name": {"$regex": search, "$options": "i"}},
                        {"display_name": {"$regex": search, "$options": "i"}},
                        {"aliases": {"$regex": search, "$options": "i"}},
                        {"description": {"$regex": search, "$options": "i"}}
                    ]
                cursor = self._collection.find(query).sort("precedence_rank", 1)
                for doc in cursor:
                    doc["id"] = str(doc.pop("_id", doc.get("id")))
                    entities.append(doc)
                return entities
            except Exception as e:
                logger.warning(f"MongoDB error on list_entities, falling back: {e}")

        # Fallback filtering
        raw = self._load_fallback()
        for e in raw:
            if status and e.get("status", "").upper() != status.upper():
                continue
            if category and category.lower() not in e.get("category", "").lower():
                continue
            if schema_version and e.get("schema_version") != schema_version:
                continue
            if search:
                s = search.lower()
                matches_search = (
                    s in e.get("name", "").lower() or
                    s in e.get("display_name", "").lower() or
                    s in e.get("description", "").lower() or
                    any(s in a.lower() for a in e.get("aliases", []))
                )
                if not matches_search:
                    continue
            entities.append(e)

        entities.sort(key=lambda x: x.get("precedence_rank", 50))
        return entities

    def create(self, entity_data: Dict[str, Any]) -> Dict[str, Any]:
        entity = dict(entity_data)
        entity["name"] = entity["name"].strip().upper()
        now = datetime.utcnow()
        entity["created_at"] = entity.get("created_at") or now
        entity["updated_at"] = now
        if not entity.get("id"):
            entity["id"] = str(uuid.uuid4())

        if self._collection is not None:
            try:
                insert_doc = dict(entity)
                self._collection.insert_one(insert_doc)
                # Keep local fallback synced
                fallback_items = [e for e in self._load_fallback() if e.get("name") != entity["name"]]
                fallback_items.append(entity)
                self._save_fallback(fallback_items)
                return entity
            except errors.DuplicateKeyError:
                raise ValueError(f"Entity with name '{entity['name']}' already exists.")
            except Exception as e:
                logger.warning(f"MongoDB create failed, saving to fallback: {e}")

        # Fallback persistence
        fallback_items = self._load_fallback()
        for e in fallback_items:
            if e.get("name", "").upper() == entity["name"]:
                raise ValueError(f"Entity with name '{entity['name']}' already exists.")
        fallback_items.append(entity)
        self._save_fallback(fallback_items)
        return entity

    def update(self, name: str, update_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        name_clean = name.strip().upper()
        existing = self.get_by_name(name_clean)
        if not existing:
            return None

        update_fields["updated_at"] = datetime.utcnow()
        merged = {**existing, **update_fields}

        if self._collection is not None:
            try:
                self._collection.update_one({"name": name_clean}, {"$set": update_fields})
                # Sync fallback
                fallback_items = [e for e in self._load_fallback() if e.get("name", "").upper() != name_clean]
                fallback_items.append(merged)
                self._save_fallback(fallback_items)
                return merged
            except Exception as e:
                logger.warning(f"MongoDB update failed: {e}")

        # Fallback persistence
        fallback_items = self._load_fallback()
        updated_list = []
        found = False
        for e in fallback_items:
            if e.get("name", "").upper() == name_clean:
                updated_list.append(merged)
                found = True
            else:
                updated_list.append(e)
        if not found:
            updated_list.append(merged)
        self._save_fallback(updated_list)
        return merged

    def delete(self, name: str) -> bool:
        name_clean = name.strip().upper()
        deleted = False
        if self._collection is not None:
            try:
                res = self._collection.delete_one({"name": name_clean})
                deleted = res.deleted_count > 0
            except Exception as e:
                logger.warning(f"MongoDB delete failed: {e}")

        fallback_items = self._load_fallback()
        new_items = [e for e in fallback_items if e.get("name", "").upper() != name_clean]
        if len(new_items) < len(fallback_items):
            deleted = True
            self._save_fallback(new_items)
        return deleted


# Global repository instance
dynamic_entity_repo = DynamicEntityRepository()
