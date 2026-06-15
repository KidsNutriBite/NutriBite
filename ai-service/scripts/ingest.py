import os
import sys
import json
import re
from typing import List, Dict, Any

# Add parent directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.rag.hybrid_retriever import ProductionHybridRetriever

def recursive_char_chunking(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """
    Recursively chunks text into sizes of chunk_size with overlap characters.
    Splits at smart boundaries (paragraphs, then sentences, then spaces).
    """
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
            
        if len(para) <= chunk_size:
            if len(current_chunk) + len(para) <= chunk_size:
                current_chunk += ("\n\n" if current_chunk else "") + para
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = para
        else:
            # Paragraph is too big, split into sentences
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = ""
                
            sentences = re.split(r'(?<=[.!?]) +', para)
            for sentence in sentences:
                if len(current_chunk) + len(sentence) <= chunk_size:
                    current_chunk += (" " if current_chunk else "") + sentence
                else:
                    if current_chunk:
                        chunks.append(current_chunk)
                    current_chunk = sentence
                    
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = ""
                
    if current_chunk:
        chunks.append(current_chunk)
        
    # Re-merge small chunks with overlap logic
    overlapped_chunks = []
    for i, chk in enumerate(chunks):
        if i == 0:
            overlapped_chunks.append(chk)
        else:
            prev = chunks[i-1]
            overlap_text = prev[-overlap:] if len(prev) > overlap else prev
            overlapped_chunks.append(overlap_text + " " + chk)
            
    return overlapped_chunks

def tag_metadata(chunk: str, doc_name: str) -> Dict[str, Any]:
    """
    Scans text chunk for pediatric condition, food tags, or allergies to auto-tag.
    """
    chunk_lower = chunk.lower()
    
    # Conditions mapping
    conditions = ["fever", "cold", "diarrhea", "constipation", "pregnancy", "lactation"]
    active_cond = None
    for cond in conditions:
        if cond in chunk_lower:
            active_cond = cond
            break
            
    # Allergy mapping
    allergies = ["peanut", "egg", "milk", "gluten", "soy", "fish"]
    active_allergies = []
    for allergy in allergies:
        if allergy in chunk_lower:
            active_allergies.append(allergy)
            
    # Tags extraction
    tags = []
    if active_cond:
        tags.append(active_cond)
    tags.extend(active_allergies)
    
    # Check food keywords
    foods = ["rice", "dal", "khichdi", "curd", "milk", "egg", "apple", "banana", "porridge"]
    for f in foods:
        if f in chunk_lower:
            tags.append(f)
            
    return {
        "source": doc_name,
        "type": "condition" if active_cond else ("allergy" if active_allergies else "general"),
        "condition": active_cond,
        "allergies": active_allergies,
        "tags": list(set(tags))[:5]
    }

def ingest_document(file_path: str, doc_name: str):
    """
    Reads, chunks, tags, and appends new document content to rag_data.json,
    then triggers index rebuilding in the Hybrid Retriever.
    """
    if not os.path.exists(file_path):
        print(f"[ERROR] File not found at: {file_path}")
        return
        
    print(f"[INFO] Ingesting document: {doc_name} ({file_path})")
    
    # Read content
    if file_path.endswith(".json"):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        texts = []
        if isinstance(data, list):
            for entry in data:
                if isinstance(entry, dict):
                    texts.append(entry.get("text", "") or entry.get("content", ""))
        elif isinstance(data, dict):
            texts.append(data.get("text", "") or data.get("content", ""))
        raw_text = "\n\n".join(texts)
    else:
        # Assume standard text/markdown/pdf text extract
        with open(file_path, "r", encoding="utf-8") as f:
            raw_text = f.read()
            
    # Chunking
    chunks = recursive_char_chunking(raw_text)
    print(f"[INFO] Generated {len(chunks)} text chunks.")
    
    # Load existing RAG dataset
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "datasets", "rag_data.json")
    if os.path.exists(dataset_path):
        with open(dataset_path, "r", encoding="utf-8") as f:
            try:
                rag_data = json.load(f)
            except:
                rag_data = []
    else:
        rag_data = []
        
    # Append new chunks
    start_idx = len(rag_data) + 1
    new_records = []
    for i, text in enumerate(chunks):
        meta = tag_metadata(text, doc_name)
        new_records.append({
            "id": f"RAG_INGEST_{start_idx + i}",
            "text": text,
            "metadata": meta
        })
        
    rag_data.extend(new_records)
    
    # Save back
    with open(dataset_path, "w", encoding="utf-8") as f:
        json.dump(rag_data, f, indent=2)
        
    print(f"[INFO] Successfully added {len(new_records)} items to active RAG dataset.")
    
    # Reindex Vector Store
    print("[INFO] Rebuilding Vector FAISS database...")
    retriever = ProductionHybridRetriever()
    retriever.build_or_load_indices()
    print("[INFO] Ingestion and Reindexing completed successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        # Sample Run if called directly
        print("Usage: python ingest.py <file_path> <doc_name>")
        # Create a mock text file if testing
        mock_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_guideline.txt")
        with open(mock_file, "w", encoding="utf-8") as f:
            f.write(
                "NIN Dietary Guideline 2026 for Kids.\n"
                "Children between ages 1 and 6 should have calcium-dense foods like whole milk, double-toned curd, and paneer.\n"
                "In case of mild common cold or cough, feed warm vegetable broths enriched with black pepper, garlic, and ginger.\n"
                "Avoid force feeding during illness. Frequent small feeds of warm liquids maintain hydration and electrolyte balance."
            )
        ingest_document(mock_file, "NIN Guidelines 2026")
    else:
        ingest_document(sys.argv[1], sys.argv[2])
