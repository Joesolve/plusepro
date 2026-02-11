'use client';
import { useApi } from '@/hooks/use-api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { PLAN_INFO } from '@/lib/utils';
import type { BillingOverview } from '@/types';

export default function AdminBillingPage() {
  const { data, isLoading } = useApi<BillingOverview>('/subscriptions/overview');

  if (isLoading) return <div className="space-y-4 p-6">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing Overview</h1>
        <p className="text-gray-500 mt-1">Super admin view of all tenant subscriptions</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
          <p className="text-3xl font-bold text-primary mt-1">${data?.mrr?.toLocaleString() || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Active Tenants</p>
          <p className="text-3xl font-bold text-accent mt-1">{data?.activeTenants || 0} <span className="text-sm font-normal text-gray-400">/ {data?.totalTenants || 0}</span></p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Seats Used</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {data?.seatUtilization?.reduce((s, t) => s + t.currentEmployees, 0) || 0}
          </p>
        </Card>
      </div>

      {/* Seat utilization table */}
      <Card>
        <CardHeader>
          <CardTitle>Seat Utilization by Tenant</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 px-4 font-medium text-gray-600">Tenant</th>
                <th className="py-3 px-4 font-medium text-gray-600">Plan</th>
                <th className="py-3 px-4 font-medium text-gray-600">Seats Used</th>
                <th className="py-3 px-4 font-medium text-gray-600">Max Seats</th>
                <th className="py-3 px-4 font-medium text-gray-600">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {data?.seatUtilization?.map((t) => (
                <tr key={t.tenantId} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{t.tenantName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                      {PLAN_INFO[t.plan]?.name || t.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">{t.currentEmployees}</td>
                  <td className="py-3 px-4">{t.maxEmployees}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`rounded-full h-2 ${t.utilization > 90 ? 'bg-red-500' : t.utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(t.utilization, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{t.utilization}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
