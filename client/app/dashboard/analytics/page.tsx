'use client';

import { useState, useEffect } from 'react';
import { Subject } from '@/lib/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Users, Target, Award, Info, Trophy, Loader2 } from 'lucide-react';

// --- Type Definitions & Constants ---
interface AnalyticsData {
  subjectPerformance: Array<{ subject: string; averageScore: number; totalStudents: number; }>;
  gradeDistribution: Array<{ grade: string; count: number; }>;
  trendData: Array<{ date: string; score: number; }>;
  studentLeaderboard: Array<{ studentName: string; marks: number; totalMarksPossible: number; }>;
}
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

// Hardcoded data for when real data is not available
const getHardcodedData = (): AnalyticsData => ({
  subjectPerformance: [
    { subject: 'Physics', averageScore: 82, totalStudents: 15 },
    { subject: 'Chemistry', averageScore: 76, totalStudents: 15 },
    { subject: 'Math', averageScore: 89, totalStudents: 15 },
  ],
  gradeDistribution: [
    { grade: 'A (90+)', count: 5 }, { grade: 'B (80-89)', count: 12 },
    { grade: 'C (70-79)', count: 8 }, { grade: 'D (60-69)', count: 3 },
    { grade: 'F (<60)', count: 1 },
  ],
  trendData: [
    { date: 'Jan', score: 75 }, { date: 'Feb', score: 78 }, { date: 'Mar', score: 82 },
    { date: 'Apr', score: 85 }, { date: 'May', score: 88 }, { date: 'Jun', score: 90 },
  ],
  studentLeaderboard: [
    { studentName: 'Alex Doe', marks: 95, totalMarksPossible: 100 },
    { studentName: 'Jane Smith', marks: 88, totalMarksPossible: 100 },
    { studentName: 'Sam Wilson', marks: 82, totalMarksPossible: 100 },
    { studentName: 'Jessica Ray', marks: 78, totalMarksPossible: 100 },
    { studentName: 'Tom Berns', marks: 75, totalMarksPossible: 100 },
  ],
});

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(getHardcodedData());
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [hasSufficientData, setHasSufficientData] = useState(true);

  useEffect(() => {
    // Fetch subjects for the dropdown only once
    const fetchSubjects = async () => {
      try {
        const res = await fetch('/api/subjects');
        if (!res.ok) throw new Error('Failed to fetch subjects');
        const data = await res.json();
        setSubjects(data);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };
    fetchSubjects();
  }, []);
  
  useEffect(() => {
    // Fetch analytics data whenever the selected subject changes
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?subjectId=${selectedSubject}`);
        const data = await res.json();

        if (data.status === 'insufficient_data') {
          // If API reports insufficient data, use hardcoded data and show warning
          setHasSufficientData(false);
          setAnalyticsData(getHardcodedData());
        } else {
          // If data is present, use it and hide the warning
          setHasSufficientData(true);
          setAnalyticsData(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setHasSufficientData(false); // Fallback to sample data on error
        setAnalyticsData(getHardcodedData());
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [selectedSubject]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-lg">Loading Analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalEvaluated = analyticsData.gradeDistribution.reduce((sum, grade) => sum + grade.count, 0);
  const totalAverage = analyticsData.subjectPerformance.reduce((acc, sub) => acc + sub.averageScore * sub.totalStudents, 0) / Math.max(analyticsData.subjectPerformance.reduce((acc, sub) => acc + sub.totalStudents, 0), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">Insights and performance metrics for your grading system.</p>
          </div>
          
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Insufficient Data Warning Banner */}
        {!hasSufficientData && (
          <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-md flex items-center gap-3">
            <Info size={20} />
            <div>
              <p className="font-bold">Displaying Sample Data</p>
              <p className="text-sm">There is not enough evaluated data to generate real-time analytics. Please evaluate more answer sheets.</p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
              <Target className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAverage.toFixed(2)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluated</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvaluated}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Grades (A)</CardTitle>
              <Award className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.gradeDistribution[0]?.count || 0}</div>
            </CardContent>
          </Card>
          <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Trend</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12%</div>
              <p className="text-xs text-muted-foreground">vs. last month (demo)</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Average scores across all subjects.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.subjectPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="averageScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy size={18}/> Top Students</CardTitle>
              <CardDescription>Ranked by marks for the selected filter.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.studentLeaderboard.length > 0 ? (
                    analyticsData.studentLeaderboard.slice(0, 5).map((student, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell className="text-right">{`${student.marks} / ${student.totalMarksPossible}`}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                        No evaluated sheets found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>Breakdown of grades for the selected filter.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analyticsData.gradeDistribution} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={100} fill="hsl(var(--primary))" label>
                      {analyticsData.gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}