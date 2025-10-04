# Smart Grading System

The **Smart Grading System** is an intelligent answer evaluation platform that automatically grades handwritten or typed answer sheets based on *semantic* and *thematic* similarity to a model answer sheet. It uses advanced OCR (Gemini), natural language analysis (BERT embeddings, NLTK), and a structured evaluation pipeline.

---

## Overview

This project provides an end-to-end AI-based assessment system designed for educational and institutional use.
It allows educators to upload model answers and student answer sheets (PDF format) and automatically evaluates them on question-by-question basis.

The system consists of three main components:

1. **Client:** Next.js-based web interface for uploading answer sheets and viewing detailed scores.
2. **Backend:** Firebase for authentication, storage, and database.
3. **Evaluator Service:** FastAPI + Python microservice responsible for OCR, semantic, and thematic scoring.

---

## Features

* OCR-based text extraction using **Google Gemini 1.5 Flash**
* **Semantic similarity** using `sentence-transformers/bert-base-nli-mean-tokens`
* **Thematic similarity** using synonym-normalized token matching (NLTK)
* **Question-wise scoring** combining both semantic and thematic scores
* **Firebase** authentication and real-time data sync
* **Next.js** frontend for interactive UI and detailed reports
* **FastAPI** backend for scalable API endpoints
* **Multi-page PDF** and **multi-answer question** support

---

## Project Structure

```
smart-grading-system/
│
├── client/                      # Next.js Frontend
│   ├── app/
│   ├── components/
│   ├── lib/firebase.ts
│   ├── package.json
│   └── ...
│
├── server/                      # FastAPI Service
│   ├── main.py
│   ├── models/
│   │   ├── semantic.py
│   │   └── thematic.py
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## Setup Instructions

### 1. Prerequisites

* Node.js (>= 18)
* Python (>= 3.9)
* Firebase Project (with Firestore and Storage enabled)
* Google API Key for Gemini

---

### 2. Frontend (Next.js + Firebase)

1. Navigate to the client folder:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Firebase:

   * Create a `firebase.js` file in `/client`.
   * Add your Firebase config:

     ```javascript
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

4. Run the Next.js client:

   ```bash
   npm run dev
   ```

   The client runs at **[http://localhost:3000](http://localhost:3000)**

---

### 3. Backend (FastAPI Evaluator)

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Create and activate a Python virtual environment:

   ```bash
   python3 -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file:

   ```
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```

5. Run the FastAPI server:

   ```bash
   uvicorn main:app --reload
   ```

   The API runs at **[http://localhost:8000](http://localhost:8000)**

---

### 4. Connect Client and Server

In your Next.js environment file (`.env.local`):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Use this base URL to make requests from the frontend to the FastAPI server.

---

## API Endpoints

| Method | Endpoint    | Description                                    |
| ------ | ----------- | ---------------------------------------------- |
| `GET`  | `/health`   | Health check                                   |
| `POST` | `/evaluate` | Evaluate model and student answer sheets (PDF) |

---

## Evaluation Logic

* **OCR Stage:** Gemini extracts and structures text from PDFs.
* **Text Structuring:** Answers are grouped by question ID (`Q1`, `Q2`, etc.).
* **Similarity Analysis:**

  * *Semantic:* via BERT embeddings cosine similarity.
  * *Thematic:* via NLTK token-based cosine comparison.
* **Scoring:** Weighted scoring using parameters:

  ```
  Final Score = (α × Semantic) + (β × Thematic)
  ```

  Default: `α = 0.5`, `β = 0.3`, scaled to 5 marks per question.

---

## Example Response

```json
{
  "total_marks": 18.2,
  "max_possible_marks": 25,
  "question_wise_scores": [
    {"question": "Q1", "score": 4.5},
    {"question": "Q2", "score": 3.9},
    {"question": "Q3", "score": 4.2}
  ],
  "model_answers_structured": {"Q1": "...", "Q2": "..."},
  "student_answers_structured": {"Q1": "...", "Q2": "..."}
}
```

---

## Screenshots



---

## Future Enhancements

* Multi-language OCR support
* Teacher feedback summary generation
* AI-based rubric suggestion
* Integration with LMS platforms

---

## License

This project is open-source and distributed under the **MIT License**.

---