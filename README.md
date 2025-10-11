# Smart Grading System

The **Smart Grading System** is an intelligent answer evaluation platform that automatically grades handwritten or typed answer sheets based on *semantic* and *thematic* similarity to a model answer sheet. It uses a modern tech stack, including advanced OCR with Google Gemini, natural language analysis with Sentence Transformers, and a scalable, modular microservice architecture.

-----

## Overview

This project provides an end-to-end AI-based assessment system designed for educational and institutional use. It allows educators to upload model answers and student answer sheets (in PDF format) and automatically evaluates them on a question-by-question basis.

The system consists of three main components:

1.  **Client:** A Next.js-based web interface for uploading answer sheets and viewing detailed, structured scores.
2.  **Backend:** Firebase for user authentication, cloud storage, and a real-time database to sync results.
3.  **Evaluator Service:** A modular FastAPI and Python microservice responsible for the heavy lifting: OCR, semantic analysis, and thematic scoring.

-----

## Features

  * **Advanced OCR:** Text extraction and structuring using **Google Gemini 2.0 Flash**.
  * **Semantic Similarity:** Deep meaning comparison using `sentence-transformers/bert-base-nli-mean-tokens`.
  * **Thematic Similarity:** Keyword and topic comparison using synonym-normalized token matching (NLTK).
  * **Modular & Scalable:** The evaluation logic is encapsulated in singleton classes for efficiency and maintainability.
  * **Detailed Scoring:** Provides a breakdown of scores for each sub-question and calculates a total based on exam rules (e.g., "best 2 of 3").
  * **Firebase Integration:** Secure authentication and real-time data synchronization with the frontend.
  * **Modern Stack:** Next.js for a responsive UI and FastAPI for a high-performance Python backend.

-----

## Project Structure

The project is organized into a clean, modern monorepo structure with a clear separation of concerns.

```
smart-grading-system/
│
├── client/                      # Next.js Frontend
│   ├── app/
│   ├── components/
│   ├── lib/firebase.ts
│   └── ...
│
├── server/                      # FastAPI Evaluator Service
│   ├── main.py                  # API endpoints and application entrypoint
│   ├── models/                  # Classes for individual AI/ML models
│   │   ├── semantic.py
│   │   └── thematic.py
│   ├── services/                # Business logic and coordination
│   │   ├── __init__.py
│   │   └── evaluation_engine.py
│   │   ├── ocr_processor.py
│   ├── schemas/                 # Pydantic data schemas for API
│   │   └── evaluation_schemas.py
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables
│
└── README.md
```

-----

## Setup Instructions

### 1\. Prerequisites

  * Node.js (\>= 18)
  * Python (**3.11 recommended** to ensure library compatibility)
  * A Google API Key for the Gemini API.
  * A Firebase Project (with Authentication, Firestore, and Storage enabled).

-----

### 2\. Frontend (Next.js + Firebase)

1.  Navigate to the client folder:

    ```bash
    cd client
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Configure Firebase by creating a file at `client/lib/firebase.ts` with your project's configuration:

    ```typescript
    import { initializeApp } from "firebase/app";
    import { getAuth } from "firebase/auth";
    import { getFirestore } from "firebase/firestore";
    import { getStorage } from "firebase/storage";

    const firebaseConfig = {
      apiKey: "YOUR_FIREBASE_API_KEY",
      authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
      projectId: "YOUR_FIREBASE_PROJECT_ID",
      storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID"
    };

    const app = initializeApp(firebaseConfig);
    export const auth = getAuth(app);
    export const db = getFirestore(app);
    export const storage = getStorage(app);
    ```

4.  Run the Next.js client:

    ```bash
    npm run dev
    ```

    The client will be available at **http://localhost:3000**.

-----

### 3\. Backend (FastAPI Evaluator)

1.  Navigate to the server directory:

    ```bash
    cd server
    ```

2.  Create and activate a Python virtual environment using a compatible Python version (e.g., 3.11):

    ```bash
    # Create the virtual environment
    python3.11 -m venv venv

    # Activate it (macOS/Linux)
    source venv/bin/activate
    # On Windows: venv\Scripts\activate
    ```

3.  Upgrade pip and install dependencies from the requirements file:

    ```bash
    # Use 'python -m pip' to ensure you're using the venv's pip
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
    ```

4.  Create a `.env` file in the `server/` directory and add your Gemini API key:

    ```
    GOOGLE_API_KEY="your_gemini_api_key_here"
    ```

5.  Run the FastAPI server:

    ```bash
    uvicorn main:app --reload
    ```

    The API will be available at **http://localhost:8000**.

-----

### 4\. Connect Client and Server

In your Next.js project, create an environment file `.env.local` and add the following line to link the frontend to the backend API:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

-----

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check to confirm the server is running. |
| `POST` | `/evaluate`| Uploads model and student answer sheets (PDFs) and returns a detailed evaluation. |

-----

## Evaluation Logic

The evaluation process is a multi-stage pipeline handled by the `EvaluationEngine`:

1.  **OCR Stage:** `OcrProcessor` uses the Gemini API to extract text from each PDF and structure it into a JSON object, mapping question IDs (e.g., `Q1A`, `Q2B`) to their corresponding answer text.
2.  **Similarity Analysis:** For each common question answered by the student:
      * **Semantic Score:** The `SemanticAnalyzer` calculates the contextual similarity using BERT embeddings and cosine similarity.
      * **Thematic Score:** The `ThematicAnalyzer` calculates keyword similarity after normalizing text with NLTK and a custom synonym map.
3.  **Scoring:** The final score for each sub-question is calculated using a weighted formula:
      * `Score = (α × Semantic) + (β × Thematic)`
      * Default weights are `α = 0.5` and `β = 0.3`, with each sub-question worth `7.5` marks.
4.  **Total Marks Calculation:** The system sums the top `N` scores from each major question section (e.g., the best 2 scores from Q1A, Q1B, Q1C) to calculate the final total.

-----

## Example Response

The `/evaluate` endpoint returns a detailed JSON object that follows the `DetailedEvaluationResponse` schema:

```json
{
  "total_marks": 25.55,
  "max_possible_marks": 30.0,
  "scoreBreakdown": {
    "Q1": {
      "A": 7.15,
      "B": 6.8
    },
    "Q2": {
      "A": 5.9,
      "B": 0
    },
    "Q3": {
      "A": 6.2,
      "B": 5.4
    }
  },
  "model_answers_structured": {
    "Q1A": "The capital of France is Paris...",
    "Q1B": "The French Revolution began in 1789...",
    "Q2A": "Photosynthesis is the process used by plants...",
    "Q2B": "The chemical equation for photosynthesis is...",
    "Q3A": "The main components of a CPU are...",
    "Q3B": "RAM stands for Random Access Memory..."
  },
  "student_answers_structured": {
    "Q1A": "Paris is the capital city of France...",
    "Q1B": "The revolution in France started around 1789...",
    "Q2A": "Plants use photosynthesis to make food...",
    "Q3A": "A CPU has a control unit and an ALU...",
    "Q3B": "RAM is where the computer stores data..."
  }
}
```

-----

## Screenshots

<img width="1600" height="865" alt="image" src="https://github.com/user-attachments/assets/63cb4d6b-c9a8-431a-a10e-8bc771a6a3b2](https://github.com/user-attachments/assets/63cb4d6b-c9a8-431a-a10e-8bc771a6a3b2" />

<img width="1041" height="841" alt="image" src="https://github.com/user-attachments/assets/7b87c922-5bbe-4c79-8cff-8603665c8c8a" />


-----

## Future Enhancements

  * Support for grading different languages.
  * Generation of AI-powered qualitative feedback for students.
  * AI-based rubric and model answer suggestion tools for educators.
  * Direct integration with Learning Management System (LMS) platforms.

-----

## License

This project is open-source and distributed under the **MIT License**.

-----
