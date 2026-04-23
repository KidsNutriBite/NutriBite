import faiss
try:
    index = faiss.read_index("faiss_textbooks.index")
    print(f"INDEX_DIMENSION:{index.d}")
except Exception as e:
    print(f"ERROR:{e}")
