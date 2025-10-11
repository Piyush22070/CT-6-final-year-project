"""
This is Scoring Logic from Thematic and Sematic Scores
Depending upon the configs
(This Module is still under work)
"""

"""
Inbuilt Modules
"""
import re
from typing import Dict, Any


"""
Derived Modules
"""
from models.semantic import SemanticAnalyzer
from models.thematic import ThematicAnalyzer


class EvaluationEngine:
    """
    A class dedicated to calculating scores based on semantic and thematic analysis.
    It takes analyzer instances and a configuration dictionary during initialization.
    """
    def __init__(
        self,
        semantic_analyzer: SemanticAnalyzer,
        thematic_analyzer: ThematicAnalyzer,
        config: Dict[str, Any]
    ):
        """
        Initializes the evaluation engine.

        Args:
            semantic_analyzer: An instance of the SemanticAnalyzer class.
            thematic_analyzer: An instance of the ThematicAnalyzer class.
            config: A dictionary containing scoring parameters like ALPHA, BETA, etc.
        """
        self.semantic_analyzer = semantic_analyzer
        self.thematic_analyzer = thematic_analyzer
        self.config = config

    def _get_sub_question_part(self, q_id: str) -> str:
        """Helper method to extract the letter part ('A', 'B') from a question ID like 'Q1A'."""
        match = re.search(r'([A-Z])$', q_id, re.IGNORECASE)
        return match.group(1).upper() if match else 'MAIN'

    def evaluate(
        self,
        model_answers: Dict[str, str],
        student_answers: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Processes the structured answers and returns a detailed evaluation.

        Args:
            model_answers: A dictionary of model answers (e.g., {"Q1A": "text..."}).
            student_answers: A dictionary of student answers.

        Returns:
            A dictionary containing the calculated 'total_marks' and 'score_breakdown'.
        """

        # 1. Initialize score breakdown structure from the model answer sheet 
        score_breakdown: Dict[str, Dict[str, float]] = {}
        for q_id in model_answers.keys():
            match = re.search(r'(Q\d+)', q_id, re.IGNORECASE)
            if not match: continue
            main_q_key = match.group(1).upper()
            sub_q_part = self._get_sub_question_part(q_id)
            if main_q_key not in score_breakdown:
                score_breakdown[main_q_key] = {}
            score_breakdown[main_q_key][sub_q_part] = 0.0

        # 2. Score only the questions that the student attempted ---
        common_sub_questions = set(model_answers.keys()) & set(student_answers.keys())
        for sub_q_id in common_sub_questions:
            model_text = model_answers.get(sub_q_id, "")
            student_text = student_answers.get(sub_q_id, "")
            if not model_text or not student_text: continue

            # Get scores from the injected analyzer instances
            semantic_score = self.semantic_analyzer.calculate_similarity(model_text, student_text)['cosine_similarity']
            thematic_score = self.thematic_analyzer.calculate_similarity(model_text, student_text)
            
            # Apply weights and calculate the final score for the sub-question
            normalized_score = (self.config['ALPHA'] * semantic_score) + (self.config['BETA'] * thematic_score)
            marks_per_q = self.config['MARKS_PER_SUB_QUESTION']
            final_score = min(normalized_score * marks_per_q, marks_per_q)

            # Populate the score in the breakdown structure
            main_q_key_match = re.search(r'(Q\d+)', sub_q_id, re.IGNORECASE)
            if not main_q_key_match: continue
            main_q_key = main_q_key_match.group(1).upper()
            sub_q_part = self._get_sub_question_part(sub_q_id)
            if main_q_key in score_breakdown and sub_q_part in score_breakdown[main_q_key]:
                 score_breakdown[main_q_key][sub_q_part] = round(final_score, 2)

        # 3. Calculate total marks by summing the top N scores from each section ---
        total_marks = 0.0
        for main_q_key in score_breakdown:
            section_scores = list(score_breakdown[main_q_key].values())
            section_scores.sort(reverse=True)
            top_scores = section_scores[:self.config['MAX_SUB_QUESTIONS_PER_SECTION']]
            total_marks += sum(top_scores)


        return {
            "total_marks": round(total_marks, 2),
            "score_breakdown": score_breakdown
        }