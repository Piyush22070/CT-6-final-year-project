"""
This module levarage BERT - sentence-transformers/bert-base-nli-mean-tokens
That gives the cosine similarity
"""


"""
Inbuilt Modules
"""
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

class SemanticAnalyzer:
    """
    A class to calculate semantic similarity between two texts using a SentenceTransformer model.
    """
    def __init__(self):
        # Load the pre-trained model 
        self.model = SentenceTransformer('sentence-transformers/bert-base-nli-mean-tokens')

    def calculate_similarity(self, text1: str, text2: str) -> dict:
        """
        Calculates the cosine similarity between two pieces of text.

        Args:
            text1 (str): The first string to compare.
            text2 (str): The second string to compare.

        Returns:
            A dictionary containing the cosine similarity score.
        """
        # Encode the two texts into vector embeddings.
        embeddings = self.model.encode([text1, text2])
        
        # Calculate the cosine similarity between the two embeddings.
        # The result is a 2D array, so we access the score with [0][0].
        cosine_sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        

        return {
            "cosine_similarity": float(cosine_sim),
        }
