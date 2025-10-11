from pydantic import BaseModel
from typing import Dict

class DetailedEvaluationResponse(BaseModel):
    """
    Defines the data structure for the API response of the /evaluate endpoint.
    This model is used by FastAPI for response validation and documentation.
    """
    total_marks: float
    max_possible_marks: float
    scoreBreakdown: Dict[str, Dict[str, float]]
    model_answers_structured: Dict[str, str]
    student_answers_structured: Dict[str, str]