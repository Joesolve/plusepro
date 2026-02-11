'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useApi, useMutation } from '@/hooks/use-api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import type { Survey, SurveyResponse } from '@/types';

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: survey, isLoading: loading } = useApi<Survey>(`/surveys/${id}`);
  const { data: responses } = useApi<SurveyResponse[]>(`/surveys/${id}/responses`);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { numericValue?: number; textValue?: string; selectedOptions?: string[] }>>({});

  const submitMutation = useMutation<Record<string, unknown>, Record<string, unknown>>('post', `/surveys/${id}/respond`);

  if (loading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;
  if (!survey) return <p className="text-gray-500">Survey not found.</p>;

  const isRespondable = survey.status === 'PUBLISHED';

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answerList = survey.questions?.map((q) => ({
        questionId: q.id,
        numericValue: answers[q.id]?.numericValue ?? null,
        textValue: answers[q.id]?.textValue ?? null,
        selectedOptions: answers[q.id]?.selectedOptions ?? null,
      })) || [];
      await submitMutation.mutate({ answers: answerList });
      alert('Response submitted!');
    } catch {
      alert('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const setAnswer = (questionId: string, value: { numericValue?: number; textValue?: string; selectedOptions?: string[] }) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...value } }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/surveys" className="text-gray-400 hover:text-gray-600 text-sm">&larr; Back to Surveys</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
          {survey.description && <p className="text-gray-500 mt-1">{survey.description}</p>}
        </div>
        <Badge status={survey.status} />
      </div>

      {/* Survey Questions (respondable) */}
      {isRespondable && (
        <Card>
          <CardHeader><CardTitle>Your Response</CardTitle></CardHeader>
          <div className="p-6 pt-0 space-y-6">
            {survey.questions?.map((q, idx) => (
              <div key={q.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {idx + 1}. {q.text}
                  {q.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>

                {q.type === 'LIKERT_SCALE' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAnswer(q.id, { numericValue: n })}
                        className={`w-10 h-10 rounded-lg border-2 font-medium text-sm transition-colors ${
                          answers[q.id]?.numericValue === n
                            ? 'border-accent bg-accent text-white'
                            : 'border-gray-200 hover:border-accent/50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'YES_NO' && (
                  <div className="flex gap-3">
                    {[{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setAnswer(q.id, { numericValue: opt.value })}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                          answers[q.id]?.numericValue === opt.value
                            ? 'border-accent bg-accent text-white'
                            : 'border-gray-200 hover:border-accent/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'MULTIPLE_CHOICE' && q.options && (
                  <div className="space-y-2">
                    {(q.options as unknown as string[]).map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id]?.textValue === opt}
                          onChange={() => setAnswer(q.id, { textValue: opt })}
                          className="text-accent focus:ring-accent"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'OPEN_TEXT' && (
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    rows={3}
                    placeholder="Type your answer..."
                    value={answers[q.id]?.textValue || ''}
                    onChange={(e) => setAnswer(q.id, { textValue: e.target.value })}
                  />
                )}
              </div>
            ))}

            <Button onClick={handleSubmit} isLoading={submitting} className="mt-4">
              Submit Response
            </Button>
          </div>
        </Card>
      )}

      {/* Responses Summary (for admins/managers) */}
      {responses && responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Responses ({responses.length})</CardTitle>
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Respondent</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Submitted</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Answers</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="py-3">{(r as unknown as { isAnonymous?: boolean }).isAnonymous ? 'Anonymous' : (r as unknown as { user?: { firstName?: string } }).user?.firstName || 'User'}</td>
                      <td className="py-3 text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 text-gray-500">{r.answers?.length || 0} answers</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
