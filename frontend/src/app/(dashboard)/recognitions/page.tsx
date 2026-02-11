'use client';
import { useState } from 'react';
import { useApi, useMutation } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { CardSkeleton } from '@/components/ui/skeleton';
import { getInitials, timeAgo } from '@/lib/utils';
import type { Recognition, PaginatedResult, CoreValue } from '@/types';

export default function RecognitionsPage() {
  const { data: feed, isLoading, refetch } = useApi<PaginatedResult<Recognition>>('/recognitions/feed');
  const { data: coreValues } = useApi<CoreValue[]>('/onboarding/core-values');
  const { mutate: sendRecognition, isLoading: sending } = useMutation('post', '/recognitions');

  const [showForm, setShowForm] = useState(false);
  const [receiverId, setReceiverId] = useState('');
  const [coreValueId, setCoreValueId] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!receiverId || !coreValueId || message.length < 5) return;
    await sendRecognition({ receiverId, coreValueId, message });
    setShowForm(false);
    setReceiverId('');
    setCoreValueId('');
    setMessage('');
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recognition</h1>
          <p className="text-gray-500 mt-1">Celebrate your colleagues</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Give Recognition</Button>
      </div>

      {/* Recognition feed */}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      ) : feed?.data?.length ? (
        <div className="space-y-4">
          {feed.data.map((rec) => (
            <Card key={rec.id}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/20 text-accent rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {rec.sender ? getInitials(rec.sender.firstName, rec.sender.lastName) : '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">
                      {rec.sender ? `${rec.sender.firstName} ${rec.sender.lastName}` : 'Someone'}
                    </span>
                    {' recognized '}
                    <span className="font-semibold text-gray-900">
                      {rec.receiver ? `${rec.receiver.firstName} ${rec.receiver.lastName}` : 'Someone'}
                    </span>
                    {' for '}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                      {rec.coreValue?.name || 'a core value'}
                    </span>
                  </p>
                  <p className="text-gray-700 mt-2 text-sm italic">&ldquo;{rec.message}&rdquo;</p>
                  <p className="text-xs text-gray-400 mt-2">{timeAgo(rec.createdAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12 text-gray-400 text-sm">
            No recognitions yet. Be the first to celebrate a colleague!
          </div>
        </Card>
      )}

      {/* Send recognition modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Give Recognition">
        <div className="space-y-4">
          <Input
            label="Recipient (User ID)"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            placeholder="Enter colleague's user ID"
          />
          {coreValues?.length ? (
            <Select
              label="Core Value"
              value={coreValueId}
              onChange={(e) => setCoreValueId(e.target.value)}
              options={coreValues.map((cv) => ({ value: cv.id, label: cv.name }))}
              placeholder="Select a core value"
            />
          ) : (
            <Input label="Core Value ID" value={coreValueId} onChange={(e) => setCoreValueId(e.target.value)} placeholder="Enter core value ID" />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Why are you recognizing this person..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={sending} disabled={!receiverId || !coreValueId || message.length < 5}>
              Send Recognition
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
