import time
from flask import Flask, request, jsonify
import nltk
from nltk.corpus import wordnet as wn, stopwords
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import string
import requests
import PyPDF2
import io

app = Flask(__name__)

nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)

stop_words = set(stopwords.words('english'))

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

SYNONYM_MAP = {word: sorted(group)[0] for group in SYNONYM_GROUPS for word in group}

def normalize_tokens(tokens):
    normalized = []
    for token in tokens:
        token_lower = token.lower()
        if token_lower in stop_words or token_lower in string.punctuation:
            continue
        normalized_word = SYNONYM_MAP.get(token_lower, token_lower)
        normalized.append(normalized_word)
    return normalized

def preprocess(text):
    tokens = word_tokenize(text)
    return ' '.join(normalize_tokens(tokens))

def extract_text_from_pdf(pdf_file):
    """Extract text from uploaded PDF file"""
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file.read()))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() + " "
    return text

def send_image_to_ocr(image_file):
    """Send uploaded image to OCR service and return Markdown result."""
    ocr_url = "http://localhost:3000/ocr"
    files = {'image': (image_file.filename, image_file.stream, image_file.mimetype)}
    
    # Add retry logic
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(ocr_url, files=files)
            response.raise_for_status()
            return response.json().get("markdown", "")
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                # Reset file pointer for next attempt
                image_file.seek(0)
                time.sleep(1)  # Wait before retry
                continue
            else:
                # All retries failed
                raise Exception(f"OCR service failed after {max_retries} attempts: {str(e)}")
        except Exception as e:
            raise Exception(f"OCR processing error: {str(e)}")
    """Send uploaded image to OCR service and return Markdown result."""
    ocr_url = "http://localhost:3000/ocr"
    files = {'image': (image_file.filename, image_file.stream, image_file.mimetype)}
    
    # Add retry logic
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(ocr_url, files=files)
            response.raise_for_status()
            return response.json().get("markdown", "")
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                image_file.seek(0)
                time.sleep(1) 
                continue
            else:
                raise Exception(f"OCR service failed after {max_retries} attempts: {str(e)}")
        except Exception as e:
            raise Exception(f"OCR processing error: {str(e)}")
   
   
   
                
@app.route('/similarity', methods=['POST'])
def similarity():
    try:
        # Get files from request
        pdf_file = request.files.get('pdf')
        image_file = request.files.get('image')

        if not pdf_file or not image_file:
            return jsonify({"error": "PDF and image files are required"}), 400

        # Extract text from PDF for text1
        text1 = extract_text_from_pdf(pdf_file)

        # Send image to OCR and get markdown for text2
        text2 = send_image_to_ocr(image_file)

        # Preprocess both texts
        text1_clean = preprocess(text1)
        text2_clean = preprocess(text2)

        # Vectorize and compute similarity
        vectorizer = CountVectorizer().fit([text1_clean, text2_clean])
        vectors = vectorizer.transform([text1_clean, text2_clean])
        score = cosine_similarity(vectors[0], vectors[1])[0][0]

        return jsonify({
            "similarity_score": float(score),
            "pdf_text": text1,
            "ocr_text": text2,
            "processed_text1": text1_clean,
            "processed_text2": text2_clean
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)