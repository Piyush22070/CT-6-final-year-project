'use client';

import { useEffect, useState } from 'react';
import { Subject, Student, AnswerSheet } from '@/lib/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/ui/stats-card';
import { BookOpen, Users, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    subjects: 0,
    students: 0,
    totalUploads: 0,
    evaluated: 0,
    pending: 0
  });

  useEffect(() => {
    // Use demo data for now
    setStats({
      subjects: 3,
      students: 12,
      totalUploads: 8,
      evaluated: 6,
      pending: 2
    });
  }, []);

  // Demo data - in production this would fetch from Firebase
  const fetchStats = async () => {
    // This will be implemented when Firebase is properly configured
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your grading system overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title="Total Subjects"
            value={stats.subjects}
            icon={BookOpen}
            change="+2 this week"
            changeType="positive"
          />
          
          <StatsCard
            title="Total Students"
            value={stats.students}
            icon={Users}
            change="+12 this month"
            changeType="positive"
          />
          
          <StatsCard
            title="Answer Sheets"
            value={stats.totalUploads}
            icon={FileText}
            change="+5 today"
            changeType="positive"
          />
          
          <StatsCard
            title="Evaluated"
            value={stats.evaluated}
            icon={CheckCircle}
          />
          
          <StatsCard
            title="Pending Review"
            value={stats.pending}
            icon={Clock}
          />
          
          <StatsCard
            title="Average Score"
            value="--"
            icon={TrendingUp}
            comingSoon={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Mathematics subject created</span>
                <span className="text-gray-400 ml-auto">2 hours ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">5 answer sheets evaluated</span>
                <span className="text-gray-400 ml-auto">4 hours ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">New student added to Physics</span>
                <span className="text-gray-400 ml-auto">1 day ago</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 font-medium transition-colors">
                Create Subject
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-green-600 font-medium transition-colors">
                Add Students
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-600 font-medium transition-colors">
                Upload Sheets
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-600 font-medium transition-colors">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}