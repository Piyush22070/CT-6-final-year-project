export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  totalMarks: number;
  createdAt: Date;
  teacherId: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  subjectIds: string[];
  createdAt: Date;
}

export interface AnswerSheet {
  id: string;
  studentId: string;
  subjectId: string;
  marks?: number;
  totalMarks: number;
  status: 'pending' | 'evaluated' | 'error';
  filePath: string;
  evaluatedAt?: Date;
  createdAt: Date;
}

export interface EvaluationResult {
  studentId: string;
  subjectId: string;
  marks: number;
  totalMarks: number;
  feedback?: string;
}