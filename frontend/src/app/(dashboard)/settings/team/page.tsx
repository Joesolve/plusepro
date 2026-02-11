'use client';

import { useState } from 'react';
import { useApi, useMutation } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { CardSkeleton } from '@/components/ui/skeleton';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: { name: string };
  isActive: boolean;
}

interface Department {
  id: string;
  name: string;
}

export default function TeamSettingsPage() {
  const { data: members, isLoading: loading, refetch } = useApi<TeamMember[]>('/users');
  const { data: departments } = useApi<Department[]>('/departments');
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'EMPLOYEE', departmentId: '' });
  const inviteMutation = useMutation<Record<string, unknown>, Record<string, string>>('post', '/users');

  const handleInvite = async () => {
    try {
      await inviteMutation.mutate(form);
      setShowInvite(false);
      setForm({ email: '', firstName: '', lastName: '', role: 'EMPLOYEE', departmentId: '' });
      refetch();
    } catch {
      alert('Failed to invite user');
    }
  };

  if (loading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage your team members and their roles</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>Add Member</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Name</th>
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Email</th>
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Role</th>
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Department</th>
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {members?.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                        {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                      </div>
                      <span className="font-medium">{m.firstName} {m.lastName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-gray-500">{m.email}</td>
                  <td className="py-3 px-6">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      {m.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-gray-500">{m.department?.name || '—'}</td>
                  <td className="py-3 px-6">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!members || members.length === 0) && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">No team members yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Add Team Member">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: 'EMPLOYEE', label: 'Employee' },
              { value: 'MANAGER', label: 'Manager' },
              { value: 'COMPANY_ADMIN', label: 'Company Admin' },
            ]}
          />
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            options={departments?.map((d) => ({ value: d.id, label: d.name })) || []}
            placeholder="Select department"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleInvite} isLoading={inviteMutation.isLoading}>Add Member</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
