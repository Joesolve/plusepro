'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@/hooks/use-api';
import type { QuestionType } from '@/types';

interface QuestionDraft {
  id: string;
  text: string;
  type: QuestionType;
  isRequired: boolean;
  coreValueId?: string;
  options?: { choices?: string[]; min?: number; max?: number };
}

const QUESTION_TYPES = [
  { value: 'LIKERT_SCALE', label: 'Likert Scale (1-5)' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'YES_NO', label: 'Yes / No' },
  { value: 'OPEN_TEXT', label: 'Open Text' },
];

const SCHEDULE_TYPES = [
  { value: '', label: 'One-time (no recurrence)' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
];

export default function SurveyBuilderPage() {
  const router = useRouter();
  const { mutate: createSurvey, isLoading } = useMutation('post', '/surveys');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [scheduleType, setScheduleType] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [error, setError] = useState('');

  const addQuestion = () => {
    setQuestions([...questions, {
      id: crypto.randomUUID(),
      text: '',
      type: 'LIKERT_SCALE',
      isRequired: true,
      options: { min: 1, max: 5 },
    }]);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionDraft>) => {
    setQuestions(questions.map((q) => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    setError('');
    if (!title.trim()) { setError('Title is required'); return; }
    if (questions.length === 0) { setError('Add at least one question'); return; }
    if (questions.some((q) => !q.text.trim())) { setError('All questions must have text'); return; }

    try {
      await createSurvey({
        title,
        description,
        isAnonymous,
        scheduleType: scheduleType || undefined,
        status,
        questions: questions.map((q, idx) => ({
          text: q.text,
          type: q.type,
          isRequired: q.isRequired,
          sortOrder: idx,
          coreValueId: q.coreValueId,
          options: q.options,
        })),
      });
      router.push('/surveys');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create survey');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Builder</h1>
          <p className="text-gray-500 mt-1">Create a new pulse survey</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSubmit('DRAFT')} isLoading={isLoading}>
            Save Draft
          </Button>
          <Button onClick={() => handleSubmit('PUBLISHED')} isLoading={isLoading}>
            Publish
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Survey details */}
      <Card>
        <CardHeader><CardTitle>Survey Details</CardTitle></CardHeader>
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Q1 2026 Pulse Survey" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this survey..."
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded border-gray-300 text-accent focus:ring-accent" />
              Anonymous responses
            </label>
          </div>
          <Select
            label="Recurrence"
            value={scheduleType}
            onChange={(e) => setScheduleType(e.target.value)}
            options={SCHEDULE_TYPES}
          />
        </div>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Questions ({questions.length})</CardTitle>
          <Button size="sm" variant="secondary" onClick={addQuestion}>+ Add Question</Button>
        </CardHeader>

        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No questions yet. Click &quot;Add Question&quot; to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {/* Drag handle / reorder */}
                  <div className="flex flex-col gap-1 pt-1">
                    <button onClick={() => moveQuestion(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => moveQuestion(index, 'down')} disabled={index === questions.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <span className="text-sm font-medium text-gray-400 pt-2">Q{index + 1}</span>
                      <Input
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                        placeholder="Enter your question..."
                        className="flex-1"
                      />
                    </div>
                    <div className="flex gap-3 items-end">
                      <Select
                        label="Type"
                        value={question.type}
                        onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })}
                        options={QUESTION_TYPES}
                      />
                      <label className="flex items-center gap-2 text-sm pb-2">
                        <input
                          type="checkbox"
                          checked={question.isRequired}
                          onChange={(e) => updateQuestion(question.id, { isRequired: e.target.checked })}
                          className="rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        Required
                      </label>
                    </div>

                    {/* Multiple choice options */}
                    {question.type === 'MULTIPLE_CHOICE' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Choices (one per line)</label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          rows={3}
                          placeholder="Option A&#10;Option B&#10;Option C"
                          value={question.options?.choices?.join('\n') || ''}
                          onChange={(e) => updateQuestion(question.id, {
                            options: { choices: e.target.value.split('\n').filter(Boolean) },
                          })}
                        />
                      </div>
                    )}

                    {/* Likert scale range */}
                    {question.type === 'LIKERT_SCALE' && (
                      <div className="flex gap-3">
                        <Input
                          label="Min"
                          type="number"
                          value={question.options?.min || 1}
                          onChange={(e) => updateQuestion(question.id, {
                            options: { ...question.options, min: parseInt(e.target.value) },
                          })}
                          className="w-20"
                        />
                        <Input
                          label="Max"
                          type="number"
                          value={question.options?.max || 5}
                          onChange={(e) => updateQuestion(question.id, {
                            options: { ...question.options, max: parseInt(e.target.value) },
                          })}
                          className="w-20"
                        />
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button onClick={() => removeQuestion(question.id)} className="text-gray-400 hover:text-red-500 pt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
