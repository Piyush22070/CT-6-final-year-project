'use client';

import { useState, useEffect, DragEvent, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Subject, Student } from '@/lib/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2,
  User,
  Book,
  Loader2,
} from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

// --- Type Definitions ---
interface UploadFormData {
  subjectId: string;
  modelAnswer: File | null;
  studentAnswers: { file: File; studentId: string }[];
  manualStudentId?: string; // For the temporary student selection
}

interface UploadProgress {
  id: string; // Use a unique key like 'evaluation'
  file: string;
  status: 'processing' | 'completed' | 'error';
  message: string;
}

// --- Reusable Drag-and-Drop Component ---
const FileDropzone = ({
  onFilesDrop,
  children,
  className,
  disabled,
}: {
  onFilesDrop: (files: File[]) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => {
  const [isOver, setIsOver] = useState(false);
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { if (!disabled) { e.preventDefault(); setIsOver(true); }};
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { if (!disabled) { e.preventDefault(); setIsOver(false); }};
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!disabled) {
      e.preventDefault();
      setIsOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
      if (droppedFiles.length > 0) onFilesDrop(droppedFiles);
    }
  };
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${disabled ? 'bg-gray-200 cursor-not-allowed opacity-50' : isOver ? 'border-primary bg-primary/10' : 'border-gray-300 bg-gray-50 hover:border-gray-400 cursor-pointer'} ${className}`}
    >
      {children}
    </div>
  );
};


// --- Main Page Component ---
export default function UploadPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<UploadFormData>({
    defaultValues: { subjectId: '', modelAnswer: null, studentAnswers: [], manualStudentId: '' },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'studentAnswers' });
  const modelAnswerFile = watch('modelAnswer');
  const selectedSubjectId = watch('subjectId');
  const manualStudentId = watch('manualStudentId');

  // Fetch initial data for subjects and students
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [subjectsResponse, studentsResponse] = await Promise.all([
          fetch('/api/subjects'),
          fetch('/api/students'),
        ]);
        if (!subjectsResponse.ok || !studentsResponse.ok) throw new Error('Failed to fetch data');
        const subjectsData = await subjectsResponse.json();
        const studentsData = await studentsResponse.json();
        setSubjects(subjectsData);
        setStudents(studentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter students whenever the selected subject changes
  useEffect(() => {
    if (selectedSubjectId) {
      const filtered = students.filter((student) =>
        student.subjectIds?.includes(selectedSubjectId)
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [selectedSubjectId, students]);

  // Main submission handler for direct PDF upload
  const onSubmit = async (data: UploadFormData) => {
    console.log("✅ CHECKPOINT 1: Form submitted (Direct PDF Mode).");

    if (!data.modelAnswer || data.studentAnswers.length === 0) {
      alert("Please provide a model answer and at least one student answer sheet.");
      return;
    }
    setIsUploading(true);
    setUploadProgress([]);

    try {
      const formData = new FormData();
      formData.append('subjectId', data.subjectId);
      formData.append('modelAnswer', data.modelAnswer);

      // Create a map of filenames to student IDs to send along
      const studentInfo = data.studentAnswers.map(ans => ({ 
        studentId: ans.studentId, 
        fileName: ans.file.name 
      }));
      formData.append('studentInfo', JSON.stringify(studentInfo));
      
      // Append all student answer files
      data.studentAnswers.forEach(answer => {
        formData.append('studentAnswers', answer.file, answer.file.name);
      });

      console.log("✅ CHECKPOINT 2: Sending FormData to /api/evaluate...");
      setUploadProgress([{ id: 'evaluation', file: 'Batch Evaluation', status: 'processing', message: 'Sending all files to AI...' }]);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData, // The browser will automatically set the correct 'multipart/form-data' header
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.details || 'Evaluation API failed.');
      }

      const result = await response.json();
      console.log("✅ CHECKPOINT 3: Received successful response from API:", result);
      setUploadProgress([{ id: 'evaluation', file: 'Batch Evaluation', status: 'completed', message: result.message || 'Evaluation complete.' }]);

    } catch (error: any) {
      console.error("❌ CHECKPOINT ERROR: Process failed.", error);
      setUploadProgress([{ id: "error", file: "Process Error", status: 'error', message: error.message }]);
    } finally {
      console.log("✅ CHECKPOINT 4: Process finished.");
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload & Evaluate Sheets</h1>
          <p className="text-muted-foreground mt-2">
            Evaluate multiple student answer sheets in a single batch.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Evaluation Setup</CardTitle>
                <CardDescription>Select a subject to begin the evaluation process.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Subject Selection */}
                <div className="space-y-2">
                  <Label className="font-semibold text-base flex items-center gap-2">
                    <Book size={16} /> 1. Select Subject
                  </Label>
                  <Controller
                    name="subjectId"
                    control={control}
                    rules={{ required: 'Please select a subject' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoading ? 'Loading...' : 'Select a subject...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Step 2: Model Answer Upload */}
                <div className="space-y-2">
                  <Label className="font-semibold text-base">2. Upload Model Answer</Label>
                  <FileDropzone disabled={!selectedSubjectId} onFilesDrop={(files) => setValue('modelAnswer', files[0], { shouldValidate: true })}>
                    {!selectedSubjectId ? <p className="text-sm text-muted-foreground">Select subject first</p> :
                      modelAnswerFile ? 
                        <div className="flex items-center gap-2 p-1 text-sm text-secondary-foreground">
                          <CheckCircle size={16} className="text-green-500"/><p className="truncate">{modelAnswerFile.name}</p>
                          <button type="button" onClick={() => setValue('modelAnswer', null)}><XCircle size={16} className="hover:text-destructive" /></button>
                        </div>
                      : <><Upload className="mx-auto h-8 w-8 text-gray-400" /><span className="mt-1 text-xs text-muted-foreground">Drop one PDF</span></>
                    }
                  </FileDropzone>
                </div>

                {/* Step 3: Student Answer Upload */}
                <div className="space-y-2">
                  <Label className="font-semibold text-base flex items-center gap-2">
                    <User size={16} /> 3. Upload Student Answer
                  </Label>
                  <div className="flex items-center gap-4">
                    <Controller
                        name="manualStudentId"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={!selectedSubjectId}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={!selectedSubjectId ? "Select subject first" : "Select student to add file for..."} />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredStudents.length > 0 ? (
                                filteredStudents.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))
                              ) : (
                                <p className="p-4 text-center text-sm text-muted-foreground">No students in this subject.</p>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    <FileDropzone
                      disabled={!selectedSubjectId || !manualStudentId}
                      onFilesDrop={(files) => {
                        files.forEach((file) => append({ file, studentId: manualStudentId! }));
                        setValue('manualStudentId', ''); // Reset dropdown after adding
                      }}
                    >
                      <span className="text-sm text-muted-foreground px-4">Drop PDF here</span>
                    </FileDropzone>
                  </div>
                </div>

                {/* List of uploaded student files */}
                {fields.length > 0 && (
                  <div className="space-y-2">
                    <Label className="font-semibold text-base">Assigned Files</Label>
                    <div className="mt-2 space-y-3 p-3 bg-muted rounded-lg">
                      {fields.map((field, index) => {
                        const student = students.find((s) => s.id === field.studentId);
                        return (
                          <div key={field.id} className="flex items-center gap-4">
                            <FileText size={20} className="text-muted-foreground" />
                            <p className="flex-1 text-sm font-medium truncate">{field.file.name}</p>
                            <span className="text-sm font-semibold text-primary">
                              {student?.name || 'Unknown'}
                            </span>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Evaluation Progress</CardTitle>
                <CardDescription>Track the status of your batch upload.</CardDescription>
              </CardHeader>
              <CardContent>
                {uploadProgress.length === 0 ? <div className="text-center py-8 text-muted-foreground">Awaiting files...</div> : (
                  <div className="space-y-3">{uploadProgress.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      {p.status === 'completed' ? <CheckCircle className="text-green-500" /> : p.status === 'error' ? <AlertCircle className="text-destructive" /> : <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>}
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{p.file}</p>
                        <p className="text-xs text-muted-foreground">{p.message}</p>
                      </div>
                    </div>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Button size="sm" type="submit" disabled={isUploading || isLoading} className="w-full md:w-auto float-right">
            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>) : 
             isUploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>) : 
             (`Evaluate ${fields.length} Student(s)`)
            }
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}