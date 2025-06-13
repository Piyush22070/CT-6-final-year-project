# thematic.py
import nltk
from nltk.corpus import stopwords, wordnet as wn
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import string
import PyPDF2
import io

nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)

class ThematicAnalyzer:
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

    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.synonym_map = {word: sorted(group)[0] for group in self.SYNONYM_GROUPS for word in group}

    def extract_text_from_pdf(self, pdf_file) -> str:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_file.read()))
        return " ".join(page.extract_text() for page in reader.pages)

    def normalize_tokens(self, tokens):
        return [
            self.synonym_map.get(token.lower(), token.lower())
            for token in tokens
            if token.lower() not in self.stop_words and token not in string.punctuation
        ]

    def preprocess(self, text: str) -> str:
        return " ".join(self.normalize_tokens(word_tokenize(text)))

    def calculate_similarity(self, text1: str, text2: str) -> float:
        text1_clean = self.preprocess(text1)
        text2_clean = self.preprocess(text2)
        vectorizer = CountVectorizer().fit([text1_clean, text2_clean])
        vectors = vectorizer.transform([text1_clean, text2_clean])
        return cosine_similarity(vectors[0], vectors[1])[0][0]
