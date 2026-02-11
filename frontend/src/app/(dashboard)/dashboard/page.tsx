'use client';
import { useAuthStore } from '@/store/auth-store';
import { useApi } from '@/hooks/use-api';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Survey, PaginatedResult, OnboardingStatus } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: surveys, isLoading: loadingSurveys } = useApi<PaginatedResult<Survey>>('/surveys?limit=5');
  const { data: onboarding } = useApi<OnboardingStatus>('/onboarding/status');

  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your organization&apos;s engagement</p>
      </div>

      {/* Onboarding progress (for admins) */}
      {isAdmin && onboarding && !onboarding.isComplete && (
        <Card className="border-accent/30 bg-accent/5">
          <CardHeader>
            <CardTitle>Complete your setup</CardTitle>
            <CardDescription>Finish setting up PulsePro for your organization</CardDescription>
          </CardHeader>
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-accent">{onboarding.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-accent rounded-full h-2 transition-all duration-500"
                style={{ width: `${onboarding.progress}%` }}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {onboarding.steps.map((step) => (
              <span
                key={step.step}
                className={`text-xs px-2 py-1 rounded-full ${step.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {step.completed ? '\u2713' : '\u25CB'} {step.label}
              </span>
            ))}
          </div>
          <Link
            href="/onboarding"
            className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
          >
            Continue setup &rarr;
          </Link>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Surveys" value={surveys?.meta?.total?.toString() || '0'} subtitle="surveys running" color="bg-blue-500" />
        <StatCard title="Team Members" value="-" subtitle="across departments" color="bg-green-500" />
        <StatCard title="Recognitions" value="-" subtitle="this month" color="bg-purple-500" />
        <StatCard title="Suggestions" value="-" subtitle="pending review" color="bg-orange-500" />
      </div>

      {/* Recent surveys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Surveys</CardTitle>
            <CardDescription>Your latest pulse surveys</CardDescription>
          </div>
          {isAdmin && (
            <Link href="/surveys/builder" className="text-sm font-medium text-accent hover:underline">
              Create New
            </Link>
          )}
        </CardHeader>

        {loadingSurveys ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : surveys?.data?.length ? (
          <div className="space-y-3">
            {surveys.data.map((survey) => (
              <Link
                key={survey.id}
                href={`/surveys/${survey.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{survey.title}</p>
                  <p className="text-sm text-gray-500">{formatDate(survey.createdAt)} &middot; {survey._count?.questions || 0} questions</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={survey.status} />
                  <span className="text-sm text-gray-400">{survey._count?.responses || 0} responses</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            No surveys yet. {isAdmin && <Link href="/surveys/builder" className="text-accent hover:underline">Create your first survey</Link>}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: string }) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <div className="w-5 h-5 bg-white/30 rounded" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}
