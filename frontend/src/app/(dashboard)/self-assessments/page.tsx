'use client';
import { useState } from 'react';
import { useApi, useMutation } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { GapAnalysis, CoreValue } from '@/types';

export default function SelfAssessmentsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'COMPANY_ADMIN';
  const { data: cycles } = useApi<Array<{ id: string; name: string }>>('/self-assessments/cycles');
  const { data: coreValues } = useApi<CoreValue[]>('/onboarding/core-values');
  const { mutate: submitAssessment, isLoading: submitting } = useMutation('post', '/self-assessments');

  const [selectedCycle, setSelectedCycle] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [gapData, setGapData] = useState<GapAnalysis[] | null>(null);

  const handleRatingChange = (coreValueId: string, rating: number) => {
    setRatings({ ...ratings, [coreValueId]: rating });
  };

  const handleSubmitSelfAssessment = async () => {
    if (!selectedCycle || !coreValues) return;
    for (const cv of coreValues) {
      if (ratings[cv.id]) {
        await submitAssessment({
          cycleId: selectedCycle,
          employeeId: user!.id,
          coreValueId: cv.id,
          rating: ratings[cv.id],
          assessmentType: 'SELF',
        });
      }
    }
    // Load gap analysis after submission
    loadGapAnalysis();
  };

  const loadGapAnalysis = async () => {
    if (!selectedCycle || !user) return;
    try {
      const { data } = await (await import('@/lib/api')).default.get<GapAnalysis[]>(
        `/self-assessments/gap-analysis/${selectedCycle}/${user.id}`,
      );
      setGapData(data);
    } catch {
      // Gap analysis not available yet
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Self-Assessment</h1>
        <p className="text-gray-500 mt-1">Rate yourself against company core values</p>
      </div>

      {/* Cycle selector */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Cycle</CardTitle>
          <CardDescription>Select an active assessment cycle</CardDescription>
        </CardHeader>
        {cycles?.length ? (
          <Select
            value={selectedCycle}
            onChange={(e) => { setSelectedCycle(e.target.value); setGapData(null); }}
            options={cycles.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select a cycle..."
          />
        ) : (
          <p className="text-sm text-gray-400">No active assessment cycles. {isAdmin && 'Create one in the admin panel.'}</p>
        )}
      </Card>

      {/* Self-rating form */}
      {selectedCycle && coreValues?.length && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Yourself</CardTitle>
            <CardDescription>Rate yourself from 1 to 10 on each core value</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            {coreValues.map((cv) => (
              <div key={cv.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{cv.name}</p>
                  {cv.description && <p className="text-xs text-gray-500">{cv.description}</p>}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => handleRatingChange(cv.id, n)}
                      className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                        ratings[cv.id] === n
                          ? 'bg-primary text-white'
                          : ratings[cv.id] && ratings[cv.id] >= n
                          ? 'bg-primary/20 text-primary'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={handleSubmitSelfAssessment} isLoading={submitting}>
              Submit Self-Assessment
            </Button>
          </div>
        </Card>
      )}

      {/* Gap analysis chart */}
      {gapData && gapData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gap Analysis</CardTitle>
            <CardDescription>Self-rating vs Manager rating per core value</CardDescription>
          </CardHeader>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="valueName" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="selfRating" name="Self" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="managerRating" name="Manager" fill="#00B4A6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {gapData.map((g) => (
              <div key={g.valueName} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{g.valueName}</span>
                <span className={`font-medium ${g.gap && g.gap > 0 ? 'text-blue-600' : g.gap && g.gap < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  Gap: {g.gap !== null ? (g.gap > 0 ? '+' : '') + g.gap : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
