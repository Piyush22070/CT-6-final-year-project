"""
This Module performs the OCR processing
"""

"""
Inbuilt Modules 
"""
import os
import io
import json
from typing import Dict

from dotenv import load_dotenv
import google.generativeai as genai
from pdf2image import convert_from_bytes


class OcrProcessor:
    """
    A class to process PDFs, perform OCR using Google's Gemini model,
    and structure the extracted text.
    """


    def __init__(self, model_name: str = "gemini-2.0-flash"):
        """
        Initializes the processor by configuring the API and loading the model.
        """
        self._configure_api()
        self.model = genai.GenerativeModel(model_name)
        self.prompt = self._get_ocr_prompt()



    def _configure_api(self):
        """Loads environment variables and configures the Google AI API."""
        load_dotenv()
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if not google_api_key:
            raise ValueError("GOOGLE_API_KEY is not set in the .env file")
        genai.configure(api_key=google_api_key)



    def _get_ocr_prompt(self) -> str:
        """Returns the standardized prompt for the OCR task."""
        return """
        You are an expert OCR model. Analyze the following images of an answer sheet.
        Your task is to extract all text and structure it by question number.
        Identify explicit question numbers that mark the beginning of a new answer, like 'Q1', 'Q.1', 'Q1 A)', 'Q1.A', 'Question 2 B', etc.
        
        IMPORTANT: Create question parts (like A, B, C) ONLY from these explicit question markers. Do NOT create new sub-question letters from text found within the body of an answer (e.g., if you see the phrase 'Task (T)' inside an answer, do NOT interpret that as sub-question 'T').
        
        Standardize the question keys to a simple format like "Q1A", "Q2B", "Q3C".
        Return the result as a single, valid JSON object where keys are the standardized question numbers
        and values are the complete, corresponding answer text for that question.
        Combine multi-page answers for the same question into a single entry.
        Do not include your own explanations or formatting like ```json. Only return the raw JSON object.

        Example output format:
        {"Q1A": "The capital of France is Paris. It is known for...", "Q2B": "The formula for water is H2O."}
        """


    async def process_pdf(self, pdf_bytes: bytes) -> Dict[str, str]:
        """
        Converts a PDF in bytes to images and uses the Gemini model to perform OCR.

        Args:
            pdf_bytes (bytes): The content of the PDF file.

        Returns:
            A dictionary of question numbers and their corresponding text.
        """
        try:
            images = convert_from_bytes(pdf_bytes)
            if not images:
                return {}

            image_parts = []
            for img in images:
                buffered = io.BytesIO()
                img.save(buffered, format="PNG")
                image_parts.append({"mime_type": "image/png", "data": buffered.getvalue()})

            response = await self.model.generate_content_async([self.prompt] + image_parts)
            
            cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
            return json.loads(cleaned_response)

        except Exception as e:
            print(f"Error during OCR processing: {e}")
            return {}
