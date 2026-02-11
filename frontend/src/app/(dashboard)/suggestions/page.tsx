'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useApi, useMutation } from '@/hooks/use-api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { CardSkeleton } from '@/components/ui/skeleton';
import { timeAgo } from '@/lib/utils';
import type { Suggestion, PaginatedResult, KeywordFrequency, SuggestionStatus } from '@/types';

export default function SuggestionsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const { data, isLoading, refetch } = useApi<PaginatedResult<Suggestion>>('/suggestions');
  const { data: keywords } = useApi<KeywordFrequency[]>('/suggestions/keywords');
  const { mutate: submitSuggestion, isLoading: submitting } = useMutation('post', '/suggestions');
  const { mutate: updateStatus } = useMutation('patch', '/suggestions');

  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (text.length < 10) return;
    await submitSuggestion({ text });
    setText('');
    setShowForm(false);
    refetch();
  };

  const handleStatusChange = async (id: string, status: SuggestionStatus) => {
    await updateStatus({ status }, `/suggestions/${id}/status`);
    refetch();
  };

  const maxKeywordCount = keywords?.length ? Math.max(...keywords.map((k) => k.count)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suggestions Box</h1>
          <p className="text-gray-500 mt-1">Anonymous feedback channel</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Submit Suggestion</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suggestions list */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            [1, 2, 3].map((i) => <CardSkeleton key={i} />)
          ) : data?.data?.length ? (
            data.data.map((s) => (
              <Card key={s.id}>
                <p className="text-gray-800 text-sm">{s.text}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Badge status={s.status} />
                    <span className="text-xs text-gray-400">{timeAgo(s.createdAt)}</span>
                  </div>
                  {isAdmin && (
                    <select
                      value={s.status}
                      onChange={(e) => handleStatusChange(s.id, e.target.value as SuggestionStatus)}
                      className="text-xs border border-gray-200 rounded px-2 py-1"
                    >
                      <option value="NEW">New</option>
                      <option value="ACKNOWLEDGED">Acknowledged</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  )}
                </div>
                {s.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {s.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card><div className="text-center py-8 text-gray-400 text-sm">No suggestions yet</div></Card>
          )}
        </div>

        {/* Keyword frequency */}
        <div>
          <Card>
            <CardHeader><CardTitle>Trending Topics</CardTitle></CardHeader>
            {keywords?.length ? (
              <div className="space-y-2">
                {keywords.slice(0, 15).map((kw) => (
                  <div key={kw.word} className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 w-24 truncate">{kw.word}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4">
                      <div
                        className="bg-accent/70 rounded-full h-4 transition-all"
                        style={{ width: `${(kw.count / maxKeywordCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{kw.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
            )}
          </Card>
        </div>
      </div>

      {/* Submit suggestion modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Submit a Suggestion">
        <p className="text-sm text-gray-500 mb-4">Your suggestion is anonymous. Share any feedback or ideas.</p>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What would you like to suggest..."
        />
        {text.length > 0 && text.length < 10 && (
          <p className="text-xs text-red-500 mt-1">Minimum 10 characters required</p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={submitting} disabled={text.length < 10}>Submit</Button>
        </div>
      </Modal>
    </div>
  );
}
