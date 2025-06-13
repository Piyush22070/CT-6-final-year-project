# main.py
import streamlit as st
import io
import os
import PyPDF2
from pdf2image import convert_from_bytes
from PIL import Image
import base64
import google.generativeai as genai
from models.semantic import SemanticAnalyzer
from models.thematic import ThematicAnalyzer
from dotenv import load_dotenv

# --- Streamlit config ---
st.set_page_config(page_title="Answer Sheet Similarity", layout="wide")
st.title("🧠 Semantic & Thematic Similarity Checker")

# --- Configure Gemini ---
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# --- Initialize analyzers ---
semantic = SemanticAnalyzer()
thematic = ThematicAnalyzer()

# --- Upload files ---
model_pdf = st.file_uploader("Upload Model Answer Sheet (PDF)", type=["pdf"])
student_pdf = st.file_uploader("Upload Student Answer Sheet (Handwritten PDF)", type=["pdf"])

# --- Calculate Similarity ---
if st.button("🔍 Calculate Similarity"):
    if not model_pdf or not student_pdf:
        st.warning("Please upload both the model answer and student handwritten PDFs.")
    else:
        with st.spinner("Processing..."):
            try:
                # Step 1: Extract model answer text using PyPDF2
                model_text = ""
                reader = PyPDF2.PdfReader(io.BytesIO(model_pdf.read()))
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        model_text += page_text + " "

                # Step 2: Convert student PDF to image (first page only)
                student_bytes = student_pdf.read()
                images = convert_from_bytes(student_bytes)
                first_page_image = images[0]

                # Convert image to base64
                buffer = io.BytesIO()
                first_page_image.save(buffer, format="PNG")
                img_bytes = buffer.getvalue()
                b64_image = base64.b64encode(img_bytes).decode()

                # Step 3: Use Gemini OCR on image
                prompt = (
                    "Extract all meaningful handwritten text from this image. "
                    "Return only clean content in plain text without page numbers or noise."
                )
                response = gemini_model.generate_content([
                    prompt,
                    {"mime_type": "image/png", "data": b64_image}
                ])
                student_text = response.text.strip()

                # Step 4: Run similarity calculations
                semantic_scores = semantic.calculate_similarity(model_text, student_text)
                thematic_score = thematic.calculate_similarity(model_text, student_text)

                # Step 5: Display results
                st.subheader("📄 Extracted Text")
                col1, col2 = st.columns(2)
                with col1:
                    st.text_area("Model Answer Text", model_text, height=300)
                with col2:
                    st.text_area("Student Answer Text (via Gemini OCR)", student_text, height=300)

                st.subheader("📊 Similarity Scores")
                st.metric("🧬 Semantic Cosine Similarity", f"{semantic_scores['cosine_similarity']:.4f}")
                st.metric("🎯 Thematic Similarity", f"{thematic_score:.4f}")

            except Exception as e:
                st.error(f"❌ Error: {e}")
