'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useApi } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import type { Survey, PaginatedResult } from '@/types';

export default function SurveysPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useApi<PaginatedResult<Survey>>('/surveys');
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
          <p className="text-gray-500 mt-1">Manage and view pulse surveys</p>
        </div>
        {isAdmin && (
          <Link href="/surveys/builder">
            <Button>+ New Survey</Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      ) : data?.data?.length ? (
        <div className="grid gap-4">
          {data.data.map((survey) => (
            <Link key={survey.id} href={`/surveys/${survey.id}`}>
              <Card className="hover:border-gray-200 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{survey.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{survey.description || 'No description'}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>{survey._count?.questions || 0} questions</span>
                      <span>{survey._count?.responses || 0} responses</span>
                      <span>Created {formatDate(survey.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge status={survey.status} />
                    {survey.scheduleType && (
                      <span className="text-xs text-gray-400">{survey.scheduleType.toLowerCase()}</span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No surveys yet</p>
            {isAdmin && (
              <Link href="/surveys/builder"><Button variant="secondary">Create First Survey</Button></Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
