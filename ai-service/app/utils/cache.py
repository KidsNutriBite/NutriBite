import hashlib
import json
from collections import OrderedDict
from typing import Dict, Any, Optional

class LRUCache:
    def __init__(self, capacity: int = 100):
        self.cache = OrderedDict()
        self.capacity = capacity
        
    def get(self, key: str) -> Optional[Any]:
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]
        
    def put(self, key: str, value: Any) -> None:
        self.cache[key] = value
        self.cache.move_to_end(key)
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

# Global singleton cache instance
_response_cache = LRUCache(capacity=200)

def generate_cache_key(query: str, intent: str, profile: Dict[str, Any]) -> str:
    """
    Generates a robust hash key combining query, intent, and critical profile attributes.
    """
    # Create a stable representation of the profile
    # Sort keys to ensure consistent hashing
    profile_subset = {
        "age": profile.get("age"),
        "weight": profile.get("weight"),
        "condition": profile.get("condition"),
        "allergies": sorted(profile.get("allergies", []))
    }
    
    # Create a string representation to hash
    key_string = json.dumps({
        "query": query.lower().strip(),
        "intent": intent,
        "profile": profile_subset
    }, sort_keys=True)
    
    return hashlib.sha256(key_string.encode('utf-8')).hexdigest()

def get_cached_response(query: str, intent: str, profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    key = generate_cache_key(query, intent, profile)
    return _response_cache.get(key)

def set_cached_response(query: str, intent: str, profile: Dict[str, Any], response: Dict[str, Any]) -> None:
    key = generate_cache_key(query, intent, profile)
    _response_cache.put(key, response)
