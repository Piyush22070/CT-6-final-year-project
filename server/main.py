# main.py
import os
import io
import json
import asyncio
import uvicorn
import random
from typing import List, Dict
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from pdf2image import convert_from_bytes
from dotenv import load_dotenv
import google.generativeai as genai

# --- Configuration ---
os.environ["TOKENIZERS_PARALLELISM"] = "false"
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY is not set in the .env file")

genai.configure(api_key=GOOGLE_API_KEY)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# --- Scoring Weights ---
ALPHA = 0.5  
BETA = 0.3 

# --- Mock Analyzers (Replace with your actual classes) ---
class SemanticAnalyzer:
    def calculate_similarity(self, text1: str, text2: str) -> dict:
        mock_score = random.uniform(0.7, 0.95)
        return {'cosine_similarity': mock_score}

class ThematicAnalyzer:
    def calculate_similarity(self, text1: str, text2: str) -> float:
        mock_score = random.uniform(0.6, 0.9)
        return mock_score

semantic = SemanticAnalyzer()
thematic = ThematicAnalyzer()

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Question-wise Answer Evaluator API",
    description="An API that performs OCR on two PDFs, evaluates answers question-by-question, and returns a detailed score breakdown."
)

# --- Pydantic Models for Response Structure ---
class QuestionScore(BaseModel):
    question: str
    score: float

class DetailedEvaluationResponse(BaseModel):
    total_marks: float
    max_possible_marks: int
    question_wise_scores: List[QuestionScore]
    model_answers_structured: Dict[str, str]
    student_answers_structured: Dict[str, str]

# --- Helper Function for Advanced OCR ---
async def perform_ocr_and_structure_answers(pdf_bytes: bytes) -> Dict[str, str]:
    """
    Converts a PDF to images and uses Gemini to perform OCR,
    returning a dictionary of question numbers and their corresponding text.
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

        prompt = """
        You are an expert OCR model. Analyze the following images of an answer sheet.
        Your task is to extract all text and structure it by question number.
        Identify question numbers like 'Q1', 'Q.1', '1)', 'Q1 A)', 'Q1.A', 'Question 1', etc.
        Standardize the question keys to a simple format like "Q1A", "Q2B", "Q3".
        
        Return the result as a single, valid JSON object where keys are the standardized question numbers
        and values are the complete, corresponding answer text for that question.
        Combine multi-page answers for the same question into a single entry.
        Do not include your own explanations or formatting like ```json. Only return the raw JSON object.

        Example output format:
        {"Q1A": "The capital of France is Paris. It is known for...", "Q2": "The formula for water is H2O."}
        """
        print("Till Gemini OCR Call")
        response = await gemini_model.generate_content_async([prompt] + image_parts)
        
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_response)

    except Exception as e:
        print(f"Error during OCR processing: {e}")
        return {}

# --- API Endpoints ---
@app.get("/health", summary="Check if the API is running")
async def health_check():
    return {"status": "ok", "message": "Working fine"}

@app.post("/evaluate", response_model=DetailedEvaluationResponse, summary="Evaluate answer sheets question-by-question")
async def evaluate_answer_sheets(
    modelAnswerSheet: UploadFile = File(...),
    handwrittenAnswerSheet: UploadFile = File(...)
):
    print("api hitted")
    try:
        model_pdf_bytes, student_pdf_bytes = await asyncio.gather(
            modelAnswerSheet.read(),
            handwrittenAnswerSheet.read()
        )
        print("Pdfs recived")

        model_answers, student_answers = await asyncio.gather(
            perform_ocr_and_structure_answers(model_pdf_bytes),
            perform_ocr_and_structure_answers(student_pdf_bytes)
        )
        print("Ocr Done")

        if not model_answers or not student_answers:
            raise HTTPException(status_code=400, detail="Could not extract structured answers from one or both PDFs.")

        question_wise_scores = []
        total_marks = 0.0
        common_questions = set(model_answers.keys()) & set(student_answers.keys())

        if not common_questions:
            raise HTTPException(status_code=400, detail="No common questions found between the model and student answer sheets.")

        for q_num in sorted(list(common_questions)):
            model_text = model_answers[q_num]
            student_text = student_answers[q_num]

            semantic_score = semantic.calculate_similarity(model_text, student_text)['cosine_similarity']
            thematic_score = thematic.calculate_similarity(model_text, student_text)

            score_out_of_5 = ((ALPHA * semantic_score) + (BETA * thematic_score)) * 5.0
            score_out_of_5 = min(score_out_of_5, 5.0)

            question_wise_scores.append({"question": q_num, "score": round(score_out_of_5, 2)})
            total_marks += score_out_of_5
            
        print("Done with Calculation")

        return {
            "total_marks": round(total_marks, 2),
            "max_possible_marks": len(common_questions) * 5,
            "question_wise_scores": question_wise_scores,
            "model_answers_structured": model_answers,
            "student_answers_structured": student_answers
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse structured JSON from Gemini OCR.")
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")

# To run the server locally
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)