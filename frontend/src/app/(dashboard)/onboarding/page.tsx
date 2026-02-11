'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, useMutation } from '@/hooks/use-api';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { OnboardingStatus } from '@/types';

const STEPS = ['Core Values', 'Upload Employees', 'First Survey', 'Schedule'];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: status, refetch } = useApi<OnboardingStatus>('/onboarding/status');
  const { mutate: setCoreValues, isLoading: savingValues } = useMutation('post', '/onboarding/core-values');
  const { mutate: uploadEmployees, isLoading: uploading } = useMutation('post', '/onboarding/employees');

  const [step, setStep] = useState(0);
  const [values, setValues] = useState([{ name: '', description: '' }]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Core values
  const addValue = () => setValues([...values, { name: '', description: '' }]);
  const updateValue = (i: number, field: string, val: string) => {
    const updated = [...values];
    (updated[i] as Record<string, string>)[field] = val;
    setValues(updated);
  };
  const removeValue = (i: number) => setValues(values.filter((_, idx) => idx !== i));

  const saveCoreValues = async () => {
    const validValues = values.filter((v) => v.name.trim());
    if (!validValues.length) return;
    await setCoreValues({ values: validValues });
    refetch();
    setStep(1);
  };

  // Step 2: CSV upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(Boolean);
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const data = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        return {
          email: cols[headers.indexOf('email')] || '',
          firstName: cols[headers.indexOf('firstname')] || cols[headers.indexOf('first_name')] || '',
          lastName: cols[headers.indexOf('lastname')] || cols[headers.indexOf('last_name')] || '',
          departmentName: cols[headers.indexOf('department')] || '',
        };
      }).filter((d) => d.email);
      setCsvData(data);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!csvData.length) return;
    await uploadEmployees({ employees: csvData });
    refetch();
    setStep(2);
  };

  const progress = status?.progress || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Setup Wizard</h1>
        <p className="text-gray-500 mt-1">Configure PulsePro for your organization</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between mb-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`text-xs font-medium ${i === step ? 'text-primary' : i < step ? 'text-accent' : 'text-gray-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-accent rounded-full h-2 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-right text-xs text-gray-400 mt-1">{progress}% complete</p>
      </div>

      {/* Step 1: Core Values */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Define Core Values</CardTitle>
            <CardDescription>What values drive your organization?</CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {values.map((v, i) => (
              <div key={i} className="flex gap-2">
                <Input value={v.name} onChange={(e) => updateValue(i, 'name', e.target.value)} placeholder="e.g., Integrity" />
                <Input value={v.description} onChange={(e) => updateValue(i, 'description', e.target.value)} placeholder="Description (optional)" />
                {values.length > 1 && (
                  <button onClick={() => removeValue(i)} className="text-gray-400 hover:text-red-500 px-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addValue}>+ Add Value</Button>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={saveCoreValues} isLoading={savingValues}>Save & Continue</Button>
          </div>
        </Card>
      )}

      {/* Step 2: Upload employees */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Employee Roster</CardTitle>
            <CardDescription>Upload a CSV with columns: email, firstName, lastName, department</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500">Click to upload CSV file</p>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </div>
            {csvData.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Preview: {csvData.length} employees found</p>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Email</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Department</th></tr></thead>
                    <tbody>
                      {csvData.slice(0, 10).map((emp, i) => (
                        <tr key={i} className="border-t"><td className="px-3 py-1.5">{emp.email}</td><td className="px-3 py-1.5">{emp.firstName} {emp.lastName}</td><td className="px-3 py-1.5">{emp.departmentName}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 10 && <p className="text-xs text-gray-400 px-3 py-2">...and {csvData.length - 10} more</p>}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={handleUpload} isLoading={uploading} disabled={!csvData.length}>Upload & Continue</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Create first survey */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Create Your First Survey</CardTitle>
            <CardDescription>Build a pulse survey to start collecting feedback</CardDescription>
          </CardHeader>
          <div className="text-center py-8">
            <Button onClick={() => router.push('/surveys/builder')}>Open Survey Builder</Button>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button variant="ghost" onClick={() => setStep(3)}>Skip</Button>
          </div>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Complete!</CardTitle>
            <CardDescription>You&apos;re ready to start using PulsePro</CardDescription>
          </CardHeader>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-gray-600 mb-4">Your organization is set up and ready to go.</p>
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
