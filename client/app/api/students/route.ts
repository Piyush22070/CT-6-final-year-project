import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, Timestamp } from '@/lib/firebase'; // Import Timestamp for type checking

/**
 * GET /api/students
 * Fetches all students from the Firestore collection.
 */
export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'students'));
    
    const students = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // ✅ Robust Check: Safely handle the createdAt field.
      // This prevents the entire API from crashing if a document
      // is missing 'createdAt' or it's not a valid Timestamp.
      const createdAtISO = data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : null;

      return {
        id: doc.id,
        ...data,
        createdAt: createdAtISO,
      };
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    // Log the full error for debugging on the server
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students
 * Creates a new student in the Firestore collection.
 * Expects a JSON body with student data, e.g., { "name": "John Doe", "grade": 10 }
 */
export async function POST(request: NextRequest) {
  try {
    // Get the data from the request body
    const data = await request.json();

    // Basic validation to ensure data is not empty
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Request body cannot be empty.' },
        { status: 400 }
      );
    }
    
    const studentDoc = {
      ...data,
      createdAt: serverTimestamp(), // Add the server-side timestamp
    };

    const docRef = await addDoc(collection(db, 'students'), studentDoc);

    // Return a success response with the new document's ID
    return NextResponse.json({
      id: docRef.id,
      ...data, // Return the original data
      createdAt: new Date().toISOString(), // Return a client-friendly timestamp
    }, { status: 201 }); // 201 Created is the correct status for a successful POST

  } catch (error) {
    console.error('Error creating student:', error);
    // Log the full error for debugging on the server
    
    // Check for potential JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}