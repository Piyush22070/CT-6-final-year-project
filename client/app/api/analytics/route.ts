import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AnswerSheet, Subject, Student } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId') || 'all';

    // 1. Fetch all necessary data from Firestore concurrently
    const [subjectsSnapshot, studentsSnapshot, answerSheetsSnapshot] = await Promise.all([
      getDocs(collection(db, 'subjects')),
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'answerSheets')),
    ]);

    const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
    const answerSheets = answerSheetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AnswerSheet[];

    // Filter out sheets that haven't been evaluated yet
    const evaluatedSheets = answerSheets.filter(sheet => sheet.status === 'evaluated' && sheet.marks != null);

    // If there are no evaluated sheets at all, we can't calculate anything
    if (evaluatedSheets.length === 0) {
      return NextResponse.json({ status: 'insufficient_data' });
    }

    // Filter sheets by the selected subject for relevant calculations
    const filteredSheets = subjectId === 'all'
      ? evaluatedSheets
      : evaluatedSheets.filter(sheet => sheet.subjectId === subjectId);
    
    // --- Calculations ---

    // Calculate Subject Performance (always for all subjects to show comparison)
    const subjectPerformance = subjects.map(subject => {
      const subjectSheets = evaluatedSheets.filter(s => s.subjectId === subject.id);
      const averageScore = subjectSheets.length > 0
        ? (subjectSheets.reduce((sum, sheet) => sum + sheet.marks, 0) / subjectSheets.length)
        : 0;
      const percentageScore = subjectSheets.length > 0
        ? (averageScore / (subjectSheets[0].totalMarksPossible || 100)) * 100
        : 0;
      return {
        subject: subject.name,
        averageScore: Math.round(percentageScore),
        totalStudents: subjectSheets.length,
      };
    });

    // Calculate Grade Distribution (for filtered sheets)
    const gradeDistribution = [
      { grade: 'A (90+)', count: 0 }, { grade: 'B (80-89)', count: 0 },
      { grade: 'C (70-79)', count: 0 }, { grade: 'D (60-69)', count: 0 },
      { grade: 'F (<60)', count: 0 },
    ];
    filteredSheets.forEach(sheet => {
      const percentage = (sheet.marks / (sheet.totalMarksPossible || 100)) * 100;
      if (percentage >= 90) gradeDistribution[0].count++;
      else if (percentage >= 80) gradeDistribution[1].count++;
      else if (percentage >= 70) gradeDistribution[2].count++;
      else if (percentage >= 60) gradeDistribution[3].count++;
      else gradeDistribution[4].count++;
    });
    
    // Calculate Student Leaderboard (for filtered sheets)
    const studentLeaderboard = filteredSheets.map(sheet => {
        const student = students.find(s => s.id === sheet.studentId);
        return {
          studentName: student?.name || 'Unknown Student',
          marks: sheet.marks,
          totalMarksPossible: sheet.totalMarksPossible || 100,
        };
      })
      .sort((a, b) => b.marks - a.marks); // Sort by marks descending

    // Calculate Trend Data (for filtered sheets)
    const monthlyScores: { [key: string]: { total: number; count: number, totalPossible: number } } = {};
    filteredSheets.forEach(sheet => {
      if (sheet.evaluatedAt) {
        // Handle both Firestore Timestamp and string dates
        const date = (sheet.evaluatedAt as any).toDate ? (sheet.evaluatedAt as any).toDate() : new Date(sheet.evaluatedAt);
        const month = date.toLocaleString('default', { month: 'short' });
        if (!monthlyScores[month]) {
          monthlyScores[month] = { total: 0, count: 0, totalPossible: 0 };
        }
        monthlyScores[month].total += sheet.marks;
        monthlyScores[month].count++;
        monthlyScores[month].totalPossible += (sheet.totalMarksPossible || 100);
      }
    });
    const trendData = Object.keys(monthlyScores).map(month => ({
      date: month,
      score: Math.round((monthlyScores[month].total / monthlyScores[month].totalPossible) * 100),
    }));

    return NextResponse.json({
      status: 'success',
      subjectPerformance,
      gradeDistribution,
      trendData,
      studentLeaderboard,
    });

  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data', details: error.message }, { status: 500 });
  }
}