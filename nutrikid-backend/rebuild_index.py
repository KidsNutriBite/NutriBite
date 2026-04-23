import pickle
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import os

def rebuild():
    print("Optimization Script: Converting Index to Fast Mode")
    print("------------------------------------------------")
    
    # 1. Load Docs
    pkl_path = "rag_docs_textbooks_only.pkl"
    if not os.path.exists(pkl_path):
        print(f"Error: {pkl_path} not found.")
        return

    print(f"Loading {pkl_path}...")
    with open(pkl_path, "rb") as f:
        documents = pickle.load(f)
    print(f"Loaded {len(documents)} documents.")

    # 2. Embed with Small Model
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    print(f"Loading model: {model_name}...")
    model = SentenceTransformer(model_name)
    
    print("Generating new embeddings (this takes a minute)...")
    embeddings = model.encode(documents, show_progress_bar=True, normalize_embeddings=True)
    
    # 3. Create FAISS Index
    print("Building FAISS index...")
    # Convert to float32 for FAISS
    embeddings = np.array(embeddings).astype('float32')
    dimension = embeddings.shape[1] # Should be 384
    
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    # 4. Save
    index_path = "faiss_textbooks.index"
    if os.path.exists(index_path):
        backup_path = index_path + ".bak"
        if os.path.exists(backup_path):
            os.remove(backup_path)
        try:
            os.rename(index_path, backup_path)
            print(f"Backed up old index to {backup_path}")
        except Exception as e:
            print(f"Warning: Could not backup old index (file might be in use): {e}")
            print("Trying to overwrite...")
        
    faiss.write_index(index, index_path)
    print(f"Success! New index saved to {index_path} with dimension {dimension}.")
    print("------------------------------------------------")
    print("You can now start the server with: uvicorn main:app --reload")

if __name__ == "__main__":
    rebuild()
