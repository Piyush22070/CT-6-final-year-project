# 🧠 Answer Sheet Similarity Checker

This project is a **Streamlit web app** that compares a **model answer sheet** (typed) with a **student's handwritten answer sheet (PDF scan)** using:

- **Semantic Similarity** (via `sentence-transformers`)
- **Thematic Similarity** (custom NLP techniques)
- **OCR with Gemini 1.5** to extract text from handwritten PDFs

---

## 🚀 Features

- 📤 Upload model & student answer sheets as PDFs
- 🤖 Extract text using:
  - `PyPDF2` (for typed model answer)
  - `Gemini OCR` (for handwritten PDF images)
- 📐 Measure:
  - Cosine similarity
  - Manhattan distance
  - Thematic overlap
- 📊 Clean UI with Streamlit
- 💾 Option to download extracted text

---

## 📸 Demo Screenshot

![App Screenshot](![alt text](image.png))

---

## 🧩 Project Structure

.
├── main.py # Streamlit UI and app logic
├── models/
│ ├── semantic.py # SemanticAnalyzer using transformers
│ └── thematic.py # ThematicAnalyzer with keyword/topic similarity
├── requirements.txt # Python dependencies
└── .env # (Optional) Contains GOOGLE_API_KEY

yaml
Copy
Edit

---

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/answer-sheet-similarity.git
cd answer-sheet-similarity
2. Install Dependencies
bash
Copy
Edit
pip install -r requirements.txt
💡 Ensure Poppler is installed and in your PATH (required for pdf2image).

Ubuntu:

bash
Copy
Edit
sudo apt install poppler-utils
macOS:

bash
Copy
Edit
brew install poppler
Windows:
Download poppler and add to your system PATH.

🔐 Environment Variables
Create a .env file with your Google API key for Gemini:

env
Copy
Edit
GOOGLE_API_KEY=your-google-api-key
Or export manually:

bash
Copy
Edit
export GOOGLE_API_KEY=your-google-api-key
▶️ Run the App
bash
Copy
Edit
streamlit run main.py
🧪 Example Use Cases
Automatic checking of exam answer sheets

AI-assisted education tools

Document similarity for handwritten records

📦 Dependencies
Major libraries:

streamlit

PyPDF2

pdf2image

Pillow

google-generativeai

sentence-transformers==4.1.0

transformers==4.41.0

torch, tensorflow, scikit-learn

dotenv, tqdm, numpy, scipy

🤝 Contributing
Contributions are welcome! Please fork this repo and submit a pull request.

🛡️ License
This project is licensed under the MIT License.

📬 Contact
Developed by CT-6-final-year-project

Got questions or feedback? Reach out on LinkedIn or open an issue.

yaml
Copy
Edit

---










