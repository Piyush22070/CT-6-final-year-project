""""
This gives the Thematic Scores Module
"""


"""
Inbuilt Modules
"""
import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity




class ThematicAnalyzer:
    """
    A singleton class to analyze the thematic similarity of two texts.

    It works by normalizing text into a "bag of words," where synonyms are
    standardized to a root word. This allows for comparing the core themes
    of a text, even if different vocabulary is used.

    The singleton pattern ensures NLTK resources and synonym maps are
    initialized only once.
    """
    
    _instance = None
    _nltk_data_downloaded = False

    # A pre-defined list of synonym groups to standardize common words.
    SYNONYM_GROUPS = [
        {"quick", "fast", "rapid", "speedy", "swift", "prompt"},
        {"intelligent", "smart", "clever", "bright", "brilliant", "wise"},
        {"happy", "joyful", "cheerful", "glad", "delighted", "content", "pleased"},
        {"sad", "unhappy", "sorrowful", "depressed", "miserable", "down"},
        {"angry", "mad", "furious", "irate", "annoyed", "outraged"},
        {"car", "automobile", "vehicle", "ride"},
        {"job", "work", "occupation", "profession", "career"},
        {"house", "home", "residence", "dwelling", "abode"},
        {"big", "large", "huge", "gigantic", "massive", "enormous"},
        {"small", "little", "tiny", "miniature", "petite"},
        {"start", "begin", "commence", "initiate", "launch"},
        {"end", "finish", "conclude", "terminate", "complete"},
        {"run", "sprint", "jog", "dash"},
        {"walk", "stroll", "saunter", "amble"},
        {"see", "observe", "view", "watch", "spot", "glimpse"},
        {"say", "tell", "speak", "utter", "state", "declare"},
        {"think", "ponder", "consider", "reflect", "contemplate"},
        {"eat", "consume", "devour", "ingest", "feast"},
        {"help", "assist", "aid", "support", "serve"},
        {"buy", "purchase", "acquire", "obtain", "procure"},
        {"beautiful", "pretty", "gorgeous", "lovely", "attractive", "stunning"},
        {"ugly", "unattractive", "hideous", "unsightly"},
        {"important", "significant", "crucial", "vital", "essential"},
        {"hard", "difficult", "challenging", "tough"},
        {"easy", "simple", "effortless", "straightforward"},
    ]


    def __new__(cls, *args, **kwargs):
        """Implements the singleton pattern."""
        if cls._instance is None:
            cls._instance = super(ThematicAnalyzer, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        """
        Initializes the ThematicAnalyzer, setting up stopwords and synonym maps.
        This setup runs only on the first instantiation.
        """
        # The hasattr check ensures this heavy lifting is only done once.
        if not hasattr(self, 'initialized'):
            self._ensure_nltk_data()
            self.stop_words = set(stopwords.words('english'))
            # Create a map where each synonym points to the first word in its sorted group.
            self.synonym_map = {
                word: sorted(group)[0] 
                for group in self.SYNONYM_GROUPS 
                for word in group
            }
            self.initialized = True

    @classmethod
    def _ensure_nltk_data(cls):
        """
        A helper method to download necessary NLTK packages if not already present.
        """
        if not cls._nltk_data_downloaded:
            try:
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
                cls._nltk_data_downloaded = True
            except Exception as e:
                print(f"Error downloading NLTK data: {e}")
                raise

    def _preprocess(self, text: str) -> str:
        """
        Tokenizes, normalizes, and cleans text by removing stopwords and punctuation.
        Synonyms are mapped to a standard root word from the SYNONYM_GROUPS.

        Args:
            text (str): The input string.

        Returns:
            A cleaned and normalized string of keywords.
        """
        if not isinstance(text, str):
            return ""
        
        tokens = word_tokenize(text)
        
        normalized_tokens = [
            self.synonym_map.get(token.lower(), token.lower())
            for token in tokens
            if token.lower() not in self.stop_words and token not in string.punctuation
        ]
        
        return " ".join(normalized_tokens)

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculates the thematic similarity between two texts using cosine similarity
        on their preprocessed "bag of words" representation.

        Args:
            text1 (str): The first text to compare.
            text2 (str): The second text to compare.

        Returns:
            A float between 0.0 and 1.0 representing the thematic similarity.
        """
        # Handle empty or non-string inputs gracefully
        if not text1 or not text2 or not isinstance(text1, str) or not isinstance(text2, str):
            return 0.0

        text1_clean = self._preprocess(text1)
        text2_clean = self._preprocess(text2)
        
        # If after cleaning, strings are empty, they are thematically identical (empty theme)
        if not text1_clean and not text2_clean:
            return 1.0
        # If one is empty and the other is not, they are not similar
        if not text1_clean or not text2_clean:
            return 0.0

        # Create a vocabulary from both texts and vectorize them
        vectorizer = CountVectorizer().fit([text1_clean, text2_clean])
        vectors = vectorizer.transform([text1_clean, text2_clean])
        
        # Calculate and return the cosine similarity
        similarity = cosine_similarity(vectors[0], vectors[1])[0][0]
        return float(similarity)

