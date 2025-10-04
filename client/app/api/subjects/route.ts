import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';


// GET all subjects
export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'subjects'));
    const subjects = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : null,
      };
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

// POST a new subject
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const subjectDoc = {
      ...data,
      teacherId: 'demo-teacher', // Replace with auth user if available
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'subjects'), subjectDoc);

    return NextResponse.json({
      id: docRef.id,
      ...data,
      teacherId: 'demo-teacher',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}
