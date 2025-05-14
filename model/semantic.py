import streamlit as st
from PIL import Image
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity, paired_manhattan_distances
import numpy as np
import io


GOOGLE_API_KEY = "AIzaSyD9ujxl0VMojzGZsU-_HeINhfNtMY2Ziys"
genai.configure(api_key=GOOGLE_API_KEY)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")


bert_model = SentenceTransformer('sentence-transformers/bert-base-nli-mean-tokens')


st.set_page_config(page_title="Image Text Similarity", layout="wide")
st.title("🧠 Image-to-Text Similarity using Gemini + BERT")

col1, col2 = st.columns(2)
with col1:
    image1 = st.file_uploader("Upload First Image", type=["png", "jpg", "jpeg"], key="img1")
with col2:
    image2 = st.file_uploader("Upload Second Image", type=["png", "jpg", "jpeg"], key="img2")

def extract_text_from_gemini(img):
    prompt = "Extract all readable text from the image.also explain the image . Return as one paragraph without new lines or explanations."
    response = gemini_model.generate_content([prompt, img])
    return response.text.strip()

if image1 and image2:
    img1 = Image.open(image1)
    img2 = Image.open(image2)

    with st.spinner("Extracting text using Gemini..."):
        text1 = extract_text_from_gemini(img1)
        text2 = extract_text_from_gemini(img2)

 
    st.subheader("📄 Extracted Text")
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("**From Image 1:**")
        st.text_area("", text1, height=200)
    with col2:
        st.markdown("**From Image 2:**")
        st.text_area("", text2, height=200)

    # BERT Embedding
    embeddings = bert_model.encode([text1, text2])
    cosine_sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    manhattan_dist = paired_manhattan_distances([embeddings[0]], [embeddings[1]])[0]

    # Results
    st.subheader("📊 Similarity Metrics")
    st.metric("Cosine Similarity", f"{cosine_sim:.4f}")
    st.metric("Manhattan Distance", f"{manhattan_dist:.2f}")

    # Interpretation
    st.subheader("🧠 Interpretation")
    if cosine_sim > 0.85:
        st.success("The texts are highly similar.")
    elif cosine_sim > 0.6:
        st.info("The texts are moderately similar.")
    else:
        st.warning("The texts are not very similar.")

else:
    st.info("Please upload two images to proceed.")

