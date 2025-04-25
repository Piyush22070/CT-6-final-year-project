import streamlit as st
import requests

# Simple page config
st.set_page_config(page_title="Similarity Score", layout="wide")

# Minimal styling - just force white background
st.markdown("""
""", unsafe_allow_html=True)

# Simple title
st.title("Answer Similarity")

# Two-column layout
col1, col2 = st.columns(2)

# File uploaders
with col1:
    st.subheader("Upload Image")
    image_file = st.file_uploader("", type=["png", "jpg", "jpeg"], key="image")
    if image_file:
        st.image(image_file, width=250,)

with col2:
    st.subheader("Upload PDF")
    pdf_file = st.file_uploader("", type=["pdf"], key="pdf")
    if pdf_file:
        st.success(f"PDF uploaded: {pdf_file.name}")

# Process button
if st.button("Calculate Similarity"):
    if image_file and pdf_file:
        with st.spinner("Processing..."):
            try:
                # Send files to backend
                files = {"image": image_file, "pdf": pdf_file}
                response = requests.post("http://127.0.0.1:3001/similarity", files=files)
                
                # Display results
                if response.status_code == 200:
                    result = response.json()
                    score = result.get("similarity_score", 0)
                    
                    st.success(f"Similarity Score: {score:.4f}")
                    
                    # Show texts
                    pdf_text = result.get("pdf_text", "")
                    ocr_text = result.get("ocr_text", "")
                    
                    text_col1, text_col2 = st.columns(2)
                    with text_col1:
                        st.text_area("Image Text", ocr_text, height=300)
                    with text_col2:
                        st.text_area("PDF Text", pdf_text, height=300)
                else:
                    st.error("Server error")
            except Exception as e:
                st.error(f"Error: {str(e)}")
    else:
        st.warning("Please upload both files")