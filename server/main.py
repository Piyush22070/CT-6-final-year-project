import os
import io
import json
import asyncio
import uvicorn
import random
import re
from typing import List, Dict, Set, Any
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
# Using a stable vision model. You can change this to a newer model
# if you have confirmed its availability and compatibility.
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# --- Scoring Weights & Exam Parameters ---
ALPHA = 0.5  
BETA = 0.3 
MARKS_PER_SUB_QUESTION = 7.5 
MAX_SUB_QUESTIONS_PER_SECTION = 2
TOTAL_POSSIBLE_MARKS = 30.0

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

# --- Pydantic Models for Response Structure (Updated) ---
class DetailedEvaluationResponse(BaseModel):
    total_marks: float
    max_possible_marks: float
    scoreBreakdown: Dict[str, Dict[str, float]] # UPDATED STRUCTURE
    model_answers_structured: Dict[str, str]
    student_answers_structured: Dict[str, str]

# --- Helper Function for Advanced OCR ---
# In main.py

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

        # --- UPDATED PROMPT ---
        prompt = """
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
        # --- END OF UPDATED PROMPT ---
        
        print("Till Gemini OCR Call")
        response = await gemini_model.generate_content_async([prompt] + image_parts)
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_response)

    except Exception as e:
        print(f"Error during OCR processing: {e}")
        return {}



# --- Helper function to get sub-question letter ---
def get_sub_question_part(q_id: str) -> str:
    """Extracts the letter part ('A', 'B', 'C') from a question ID like 'Q1A'."""
    match = re.search(r'([A-Z])$', q_id, re.IGNORECASE)
    return match.group(1).upper() if match else 'MAIN'

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
        if not model_answers:
            raise HTTPException(status_code=400, detail="Could not extract answers from model answer sheet.")

        # --- NEW SCORING LOGIC & DATA STRUCTURE ---

        # 1. Initialize score breakdown with all possible questions from the model sheet, setting scores to 0
        score_breakdown: Dict[str, Dict[str, float]] = {}
        for q_id in model_answers.keys():
            match = re.search(r'(Q\d+)', q_id, re.IGNORECASE)
            if not match: continue
            main_q_key = match.group(1).upper()
            sub_q_part = get_sub_question_part(q_id)
            if main_q_key not in score_breakdown:
                score_breakdown[main_q_key] = {}
            score_breakdown[main_q_key][sub_q_part] = 0.0

        # 2. Score only the questions the student attempted
        common_sub_questions = set(model_answers.keys()) & set(student_answers.keys())
        for sub_q_id in common_sub_questions:
            model_text = model_answers.get(sub_q_id, "")
            student_text = student_answers.get(sub_q_id, "")
            if not model_text or not student_text: continue

            semantic_score = semantic.calculate_similarity(model_text, student_text)['cosine_similarity']
            thematic_score = thematic.calculate_similarity(model_text, student_text)
            
            normalized_score = (ALPHA * semantic_score) + (BETA * thematic_score)
            final_score = min(normalized_score * MARKS_PER_SUB_QUESTION, MARKS_PER_SUB_QUESTION)

            # Populate the score in the breakdown structure
            main_q_key_match = re.search(r'(Q\d+)', sub_q_id, re.IGNORECASE)
            if not main_q_key_match: continue
            main_q_key = main_q_key_match.group(1).upper()
            sub_q_part = get_sub_question_part(sub_q_id)
            if main_q_key in score_breakdown and sub_q_part in score_breakdown[main_q_key]:
                 score_breakdown[main_q_key][sub_q_part] = round(final_score, 2)

        # 3. Calculate total marks by summing the top 2 scores from each section
        total_marks = 0.0
        for main_q_key in score_breakdown:
            section_scores = list(score_breakdown[main_q_key].values())
            section_scores.sort(reverse=True)
            top_scores = section_scores[:MAX_SUB_QUESTIONS_PER_SECTION]
            total_marks += sum(top_scores)

        print("Done with Calculation")
        
        # 4. Print the final dictionary before returning, as requested
        print("\n--- Final Score Breakdown to be stored in DB ---")
        print(json.dumps(score_breakdown, indent=2))
        print("-------------------------------------------------\n")

        return {
            "total_marks": round(total_marks, 2),
            "max_possible_marks": TOTAL_POSSIBLE_MARKS,
            "scoreBreakdown": score_breakdown,
            "model_answers_structured": model_answers,
            "student_answers_structured": student_answers
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse structured JSON from Gemini OCR.")
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)