'use client';
import { useApi } from '@/hooks/use-api';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { EngagementTrend, CompletionRate, DepartmentHeatmapData } from '@/types';

interface TopBottomQuestion {
  questionId: string;
  text: string;
  surveyTitle: string;
  averageScore: number;
}

const COLORS = ['#1E3A5F', '#00B4A6', '#5B87BB', '#33CFBF', '#84A5CC', '#66DBCF'];

export default function AnalyticsPage() {
  const { data: engagement, isLoading: l1 } = useApi<EngagementTrend[]>('/analytics/engagement-trend');
  const { data: completionRates, isLoading: l2 } = useApi<CompletionRate[]>('/analytics/completion-rates');
  const { data: heatmap, isLoading: l3 } = useApi<DepartmentHeatmapData[]>('/analytics/department-heatmap');
  const { data: topBottom } = useApi<{ top: TopBottomQuestion[]; bottom: TopBottomQuestion[] }>('/analytics/top-bottom-questions');
  useApi<Record<string, unknown>[]>('/analytics/gap-trends');
  const { data: recByValue } = useApi<Record<string, unknown>[]>('/recognitions/by-value');

  const handleExportCSV = () => {
    if (!engagement) return;
    const csv = ['Month,Average Score,Responses', ...engagement.map((e) => `${e.month},${e.averageScore},${e.responseCount}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulsepro-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Organization engagement insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>Export CSV</Button>
        </div>
      </div>

      {/* Engagement trend */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Score Trend</CardTitle>
          <CardDescription>Monthly average engagement score</CardDescription>
        </CardHeader>
        {l1 ? <CardSkeleton /> : engagement?.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagement}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="averageScore" stroke="#1E3A5F" strokeWidth={2} dot={{ fill: '#1E3A5F' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center py-8 text-gray-400 text-sm">No engagement data yet</p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion rates */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Completion Rates</CardTitle>
          </CardHeader>
          {l2 ? <CardSkeleton /> : completionRates?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={completionRates.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="title" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="completionRate" fill="#00B4A6" radius={[4, 4, 0, 0]}>
                  {completionRates.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-8 text-gray-400 text-sm">No data yet</p>
          )}
        </Card>

        {/* Recognition by core value */}
        <Card>
          <CardHeader>
            <CardTitle>Recognition by Core Value</CardTitle>
          </CardHeader>
          {recByValue?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={recByValue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="coreValueName" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E3A5F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-8 text-gray-400 text-sm">No recognition data yet</p>
          )}
        </Card>
      </div>

      {/* Department heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Department Heatmap</CardTitle>
          <CardDescription>Average scores by department and core value</CardDescription>
        </CardHeader>
        {l3 ? <CardSkeleton /> : heatmap?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Department</th>
                  {heatmap[0]?.scores?.map((s) => (
                    <th key={s.value} className="text-center py-2 px-3 font-medium text-gray-600">{s.value}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map((dept) => (
                  <tr key={dept.departmentId} className="border-t">
                    <td className="py-2 px-3 font-medium">{dept.departmentName}</td>
                    {dept.scores.map((s) => {
                      const intensity = Math.min(s.average / 5, 1);
                      const bg = `rgba(0, 180, 166, ${intensity * 0.8})`;
                      return (
                        <td key={s.value} className="text-center py-2 px-3">
                          <span
                            className="inline-block w-10 h-8 rounded flex items-center justify-center text-xs font-medium"
                            style={{ backgroundColor: bg, color: intensity > 0.5 ? 'white' : '#333' }}
                          >
                            {s.average}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-gray-400 text-sm">No department data yet</p>
        )}
      </Card>

      {/* Top/Bottom questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Scoring Questions</CardTitle></CardHeader>
          {topBottom?.top?.length ? (
            <div className="space-y-3">
              {topBottom.top.map((q, i) => (
                <div key={q.questionId} className="flex items-start gap-3">
                  <span className="text-sm font-bold text-green-600 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{q.text}</p>
                    <p className="text-xs text-gray-400">{q.surveyTitle} &middot; Avg: {q.averageScore}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-center py-4 text-gray-400 text-sm">No data</p>}
        </Card>

        <Card>
          <CardHeader><CardTitle>Bottom Scoring Questions</CardTitle></CardHeader>
          {topBottom?.bottom?.length ? (
            <div className="space-y-3">
              {topBottom.bottom.map((q, i) => (
                <div key={q.questionId} className="flex items-start gap-3">
                  <span className="text-sm font-bold text-red-600 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{q.text}</p>
                    <p className="text-xs text-gray-400">{q.surveyTitle} &middot; Avg: {q.averageScore}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-center py-4 text-gray-400 text-sm">No data</p>}
        </Card>
      </div>
    </div>
  );
}
