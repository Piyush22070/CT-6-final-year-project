# semantic.py
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity, paired_manhattan_distances

class SemanticAnalyzer:
    def __init__(self):
        self.model = SentenceTransformer('sentence-transformers/bert-base-nli-mean-tokens')

    def calculate_similarity(self, text1: str, text2: str) -> dict:
        embeddings = self.model.encode([text1, text2])
        cosine_sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return {
            "cosine_similarity": float(cosine_sim),
        }
