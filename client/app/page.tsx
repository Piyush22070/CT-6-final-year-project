'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, CheckCircle, BarChart3, Upload, Users, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDemoLogin = async () => {
    setIsLoading(true);
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push('/dashboard');
  };

  const features = [
    {
      icon: BookOpen,
      title: "Subject Management",
      description: "Create and manage subjects with detailed configurations"
    },
    {
      icon: Users,
      title: "Student Management",
      description: "Add students and organize them by classroom and subjects"
    },
    {
      icon: Upload,
      title: "Automated Grading",
      description: "Upload answer sheets for AI-powered evaluation and scoring"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive insights with charts and performance metrics"
    },
    {
      icon: CheckCircle,
      title: "Real-time Results",
      description: "Instant evaluation results with detailed feedback"
    },
    {
      icon: GraduationCap,
      title: "Grade Distribution",
      description: "Visual representation of student performance across subjects"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left side - Hero section */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-600 rounded-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Grading System</h1>
            </div>
            
            <p className="text-xl text-gray-600 mb-8">
              Revolutionize your grading process with AI-powered automated evaluation, 
              comprehensive analytics, and streamlined student management.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-sm border">
                    <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{feature.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Key Benefits:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 90% reduction in grading time</li>
                <li>• Consistent and objective evaluation</li>
                <li>• Detailed performance analytics</li>
                <li>• Secure cloud-based storage</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex-none w-96 flex items-center justify-center p-8 bg-white border-l border-gray-200">
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your grading dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="teacher@school.edu"
                    defaultValue="demo@teacher.com"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    defaultValue="demo123"
                    disabled
                  />
                </div>
                
                <Button 
                  onClick={handleDemoLogin} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Signing in...' : 'Demo Login'}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Demo Mode - No authentication required
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mt-4">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Demo Features:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ Create and manage subjects</li>
                    <li>✓ Add students to classroom</li>
                    <li>✓ Upload answer sheets for evaluation</li>
                    <li>✓ View analytics and performance metrics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}