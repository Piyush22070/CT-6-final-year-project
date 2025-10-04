import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Type for the student info mapping sent from the client
interface StudentInfo {
  studentId: string;
  fileName: string;
}

export async function POST(request: NextRequest) {
  console.log("\n🚀 Received new direct PDF evaluation request.");

  try {
    const formData = await request.formData();
    
    // ✅ FIX 1: Add checks to make sure form data exists before using it.
    const subjectId = formData.get('subjectId') as string;
    const modelAnswerFile = formData.get('modelAnswer') as File | null;
    const studentInfoValue = formData.get('studentInfo') as string | null;
    const studentAnswerFiles = formData.getAll('studentAnswers') as File[];

    if (!subjectId || !modelAnswerFile || !studentInfoValue || studentAnswerFiles.length === 0) {
      throw new Error("Missing required form data (subjectId, modelAnswer, studentInfo, or studentAnswers).");
    }
    const studentInfoList = JSON.parse(studentInfoValue) as StudentInfo[];

    const evaluatorApiUrl = process.env.EVALUATOR_API;
    if (!evaluatorApiUrl) {
      throw new Error("EVALUATOR_API environment variable is not set.");
    }
    
    // ✅ FIX 2: Read the model answer into a buffer ONCE before the loop.
    const modelAnswerBuffer = await modelAnswerFile.arrayBuffer();
    
    const fileToStudentMap = new Map(studentInfoList.map(info => [info.fileName, info.studentId]));

    console.log(`⏳ Starting concurrent evaluation for ${studentAnswerFiles.length} student(s).`);

    const evaluationPromises = studentAnswerFiles.map(async (studentFile) => {
      const studentId = fileToStudentMap.get(studentFile.name);
      if (!studentId) {
        throw new Error(`Could not find student mapping for file: ${studentFile.name}`);
      }
      
      console.log(`[ studentId: ${studentId} ] ➡️ 1. Starting evaluation.`);
      const apiFormData = new FormData();

      // ✅ FIX 3: Create a new Blob from the buffer for each request.
      apiFormData.append('modelAnswerSheet', new Blob([modelAnswerBuffer]), modelAnswerFile.name);
      apiFormData.append('handwrittenAnswerSheet', studentFile);

      console.log(`[ studentId: ${studentId} ] 🐍 2. Sending PDFs to Python evaluator.`);
      const apiResponse = await fetch(`${evaluatorApiUrl}/evaluate`, {
        method: 'POST',
        body: apiFormData,
      });

      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        throw new Error(`API failed for student ${studentId}: ${errorBody}`);
      }

      const result = await apiResponse.json();
      console.log(`[ studentId: ${studentId} ] ✨ 3. Received evaluation. Score: ${result.total_marks}`);
      
      console.log(`[ studentId: ${studentId} ] 💾 4. Creating new document in Firestore...`);
      await addDoc(collection(db, 'answerSheets'), {
          studentId: studentId,
          subjectId: subjectId,
          marks: result.total_marks,
          totalMarksPossible: result.max_possible_marks,
          scoreBreakdown: result.question_wise_scores,
          status: 'evaluated',
          evaluatedAt: serverTimestamp(),
      });
      console.log(`[ studentId: ${studentId} ] ✅ 5. Firestore document created.`);

      return { studentId, status: 'success', marks: result.total_marks };
    });

    const results = await Promise.allSettled(evaluationPromises);
    console.log("🏁 All concurrent evaluations have completed.");

    const summary = results.map(result => {
        if (result.status === 'fulfilled') return result.value;
        console.error("❗️ A single evaluation failed:", (result.reason as Error).message);
        return { status: 'error', reason: (result.reason as Error).message };
    });
    
    console.log("✅ Batch process finished. Sending summary to client.");
    return NextResponse.json({
      message: "Batch evaluation process completed.",
      summary
    });

  } catch (error: any) {
    console.error("❗️ Batch evaluation process failed with a critical error:", error.message);
    return NextResponse.json(
      { error: 'A critical error occurred during the batch evaluation.', details: error.message },
      { status: 500 }
    );
  }
}