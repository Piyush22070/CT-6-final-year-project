'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Subject } from '@/lib/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BookOpen, Users, FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  description: z.string().optional(),
  totalMarks: z.number().min(1, 'Total marks must be greater than 0'),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get<Subject[]>('/api/subjects');
      setSubjects(res.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SubjectFormData) => {
    try {
      await axios.post('/api/subjects', data);
      reset();
      setIsDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      console.error('Error creating subject:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading subjects...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
            <p className="text-gray-600 mt-2">Manage your subjects and course materials</p>
          </div>

          {/* Add Subject Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={20} /> Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Subject Name</Label>
                  <Input id="name" {...register('name')} placeholder="e.g., Mathematics" />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="code">Subject Code</Label>
                  <Input id="code" {...register('code')} placeholder="e.g., MATH101" />
                  {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code.message}</p>}
                </div>
                <div>
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input id="totalMarks" type="number" {...register('totalMarks', { valueAsNumber: true })} placeholder="100" />
                  {errors.totalMarks && <p className="text-sm text-red-600 mt-1">{errors.totalMarks.message}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea id="description" {...register('description')} placeholder="Brief description" rows={3} />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Creating...' : 'Create Subject'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subject Cards */}
        {subjects.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first subject</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus size={20} className="mr-2" /> Create First Subject
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen size={20} /> {subject.name}
                  </CardTitle>
                  <CardDescription>{subject.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subject.description && <p className="text-sm text-gray-600">{subject.description}</p>}
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Total Marks: {subject.totalMarks}</span>
                      <span>Created: {subject.createdAt ? new Date(subject.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users size={14} /> <span>0 Students</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FileText size={14} /> <span>0 Uploads</span>
                      </div>
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
