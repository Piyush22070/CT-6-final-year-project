""""
This is Main.py
"""


"""
Inbuilt Modules
"""
import os
import json
import asyncio
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException



"""
Derived Modules
"""
from services.ocr_processor import OcrProcessor
from models.semantic import SemanticAnalyzer
from models.thematic import ThematicAnalyzer
from services.evaluation_engine import EvaluationEngine
from schemas.evaluation_schemas import DetailedEvaluationResponse

"""
Configs
"""
os.environ["TOKENIZERS_PARALLELISM"] = "false"



"""
Configs as per req
"""""
SCORING_CONFIG = {
    "ALPHA": 0.5,  # Weight for semantic similarity
    "BETA": 0.3,   # Weight for thematic similarity
    "MARKS_PER_SUB_QUESTION": 7.5,
    "MAX_SUB_QUESTIONS_PER_SECTION": 2,
    "TOTAL_POSSIBLE_MARKS": 30.0
}



"""
Object Creation
"""
print("Initializing services...")
ocr_processor = OcrProcessor()
semantic_analyzer = SemanticAnalyzer()
thematic_analyzer = ThematicAnalyzer()
evaluation_engine = EvaluationEngine(
    semantic_analyzer=semantic_analyzer,
    thematic_analyzer=thematic_analyzer,
    config=SCORING_CONFIG
)
app = FastAPI(
    title="Question-wise Answer Evaluator API",
    description="An API that performs OCR, evaluates answers question-by-question, and returns a detailed score breakdown."
)
print("Services initialized successfully.")



""""
Health Endpoint
"""
@app.get("/health", summary="Check if the API is running")
async def health_check():
    return {"status": "ok", "message": "API is running and services are initialized."}



"""""
Evaluation Endpoint
"""

@app.post("/evaluate", response_model=DetailedEvaluationResponse, summary="Evaluate answer sheets question-by-question")
async def evaluate_answer_sheets(
    modelAnswerSheet: UploadFile = File(...),
    handwrittenAnswerSheet: UploadFile = File(...)
):
    print("API endpoint /evaluate hit.")
    try:

        # 1. Read PDF files into memory 
        model_pdf_bytes, student_pdf_bytes = await asyncio.gather(
            modelAnswerSheet.read(),
            handwrittenAnswerSheet.read()
        )
        print("PDFs received and read into memory.")


        # 2. Perform OCR on both PDFs
        model_answers, student_answers = await asyncio.gather(
            ocr_processor.process_pdf(model_pdf_bytes),
            ocr_processor.process_pdf(student_pdf_bytes)
        )
        print("OCR processing complete.")

        if not model_answers:
            raise HTTPException(status_code=400, detail="Could not extract any structured answers from the model answer sheet.")
        if not student_answers:
            print("Warning: No structured answers extracted from the student sheet. Evaluation will result in 0 marks.")



        # 3. EvaluationEngine instance
        evaluation_results = evaluation_engine.evaluate(model_answers, student_answers)
        print("Answer evaluation complete.")
        
        # 4. Prepare and return the final API response
        print("\n--- Final Score Breakdown to be stored in DB ---")
        print(json.dumps(evaluation_results['score_breakdown'], indent=2))
        print("-------------------------------------------------\n")

        return {
            "total_marks": evaluation_results['total_marks'],
            "max_possible_marks": SCORING_CONFIG['TOTAL_POSSIBLE_MARKS'],
            "scoreBreakdown": evaluation_results['score_breakdown'],
            "model_answers_structured": model_answers,
            "student_answers_structured": student_answers
        }

    except json.JSONDecodeError:
        print("Error: Failed to parse JSON from the OCR service.")
        raise HTTPException(status_code=500, detail="Failed to parse structured JSON from the OCR service.")
    except Exception as e:
        print(f"An unexpected error occurred in /evaluate: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)