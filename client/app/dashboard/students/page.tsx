'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Student, Subject } from '@/lib/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Mail, BookOpen, Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const studentSchema = z.object({
  name: z.string().min(1, 'Student name is required'),
  email: z.string().email('Valid email is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  subjectId: z.string().min(1, 'Please select a subject'),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema)
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, subjectsRes] = await Promise.all([
        axios.get<Student[]>('/api/students'),
        axios.get<Subject[]>('/api/subjects'),
      ]);
      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    try {
      await axios.post('/api/students', {
        name: data.name,
        email: data.email,
        rollNumber: data.rollNumber,
        subjectIds: [data.subjectId],
      });
      reset();
      setIsDialogOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error creating student:', error);
    }
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading students...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600 mt-2">Manage your classroom and student enrollments</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={20} />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Student Name</Label>
                  <Input id="name" {...register('name')} placeholder="e.g., John Doe" />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="student@example.com" />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input id="rollNumber" {...register('rollNumber')} placeholder="e.g., 2024001" />
                  {errors.rollNumber && <p className="text-sm text-red-600 mt-1">{errors.rollNumber.message}</p>}
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Controller
                    name="subjectId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.subjectId && <p className="text-sm text-red-600 mt-1">{errors.subjectId.message}</p>}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Adding...' : 'Add Student'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
            <p className="text-gray-600 mb-6">Start by adding students to your classroom</p>
            <Button onClick={() => setIsDialogOpen(true)} disabled={subjects.length === 0}>
              <Plus size={20} className="mr-2" />
              Add First Student
            </Button>
            {subjects.length === 0 && <p className="text-sm text-gray-500 mt-2">Create a subject first to add students</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={20} />
                    {student.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} />
                      {student.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      Roll No: {student.rollNumber}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {/* --- ✅ FIX IS HERE --- */}
                      {student.subjectIds?.map((subjectId) => (
                        <Badge key={subjectId} variant="secondary" className="text-xs">
                          <BookOpen size={12} className="mr-1" />
                          {getSubjectName(subjectId)}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 pt-2">
                      Added: {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}