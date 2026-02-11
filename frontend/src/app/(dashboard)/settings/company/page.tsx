'use client';
import { useApi } from '@/hooks/use-api';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { Department, CoreValue } from '@/types';

export default function CompanySettingsPage() {
  const { data: departments, isLoading: l1 } = useApi<Department[]>('/departments');
  const { data: coreValues, isLoading: l2 } = useApi<CoreValue[]>('/onboarding/core-values');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Manage organizational departments</CardDescription>
          </CardHeader>
          {l1 ? <CardSkeleton /> : departments?.length ? (
            <div className="space-y-2">
              {departments.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-400">{d._count?.users || 0} members</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No departments yet</p>
          )}
        </Card>

        {/* Core Values */}
        <Card>
          <CardHeader>
            <CardTitle>Core Values</CardTitle>
            <CardDescription>Your organization&apos;s core values</CardDescription>
          </CardHeader>
          {l2 ? <CardSkeleton /> : coreValues?.length ? (
            <div className="space-y-2">
              {coreValues.map((cv) => (
                <div key={cv.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{cv.name}</p>
                    {cv.description && <p className="text-xs text-gray-400">{cv.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 mb-2">No core values defined yet</p>
              <Link href="/onboarding" className="text-sm text-accent hover:underline">Set up core values</Link>
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/settings/billing">
          <Card className="hover:border-gray-200 hover:shadow-md transition-all cursor-pointer">
            <p className="font-semibold text-gray-900">Billing & Subscription</p>
            <p className="text-sm text-gray-500 mt-1">Manage your plan and payment</p>
          </Card>
        </Link>
        <Link href="/settings/team">
          <Card className="hover:border-gray-200 hover:shadow-md transition-all cursor-pointer">
            <p className="font-semibold text-gray-900">Team Management</p>
            <p className="text-sm text-gray-500 mt-1">Add and manage team members</p>
          </Card>
        </Link>
        <Link href="/onboarding">
          <Card className="hover:border-gray-200 hover:shadow-md transition-all cursor-pointer">
            <p className="font-semibold text-gray-900">Setup Wizard</p>
            <p className="text-sm text-gray-500 mt-1">Re-run the onboarding wizard</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
