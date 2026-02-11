'use client';

import { useState } from 'react';
import { useApi, useMutation } from '@/hooks/use-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count?: { users: number };
  subscription?: { plan: string; status: string };
}

export default function AdminTenantsPage() {
  const { data: tenants, isLoading: loading, refetch } = useApi<Tenant[]>('/tenants');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', adminEmail: '', adminFirstName: '', adminLastName: '', adminPassword: '' });
  const createMutation = useMutation<Record<string, unknown>, Record<string, string>>('post', '/tenants');

  const handleCreate = async () => {
    try {
      await createMutation.mutate(form);
      setShowCreate(false);
      setForm({ name: '', slug: '', adminEmail: '', adminFirstName: '', adminLastName: '', adminPassword: '' });
      refetch();
    } catch {
      alert('Failed to create tenant');
    }
  };

  if (loading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tenants</h1>
          <p className="text-gray-500 mt-1">Manage all registered organizations</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Create Tenant</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-500">Total Tenants</p>
            <p className="text-3xl font-bold text-gray-900">{tenants?.length || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {tenants?.filter((t) => t.subscription?.status === 'ACTIVE').length || 0}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-3xl font-bold text-primary">
              {tenants?.reduce((s, t) => s + (t._count?.users || 0), 0) || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Organization</th>
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Slug</th>
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Plan</th>
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Users</th>
                <th className="text-left py-3 px-6 text-gray-500 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {tenants?.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-6 font-medium">{t.name}</td>
                  <td className="py-3 px-6 text-gray-500 font-mono text-xs">{t.slug}</td>
                  <td className="py-3 px-6">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent">
                      {t.subscription?.plan || 'STARTER'}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <Badge status={t.subscription?.status || 'ACTIVE'} />
                  </td>
                  <td className="py-3 px-6">{t._count?.users || 0}</td>
                  <td className="py-3 px-6 text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!tenants || tenants.length === 0) && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No tenants yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Tenant Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Tenant">
        <div className="space-y-4">
          <Input label="Organization Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="my-company" />
          <hr className="border-gray-100" />
          <p className="text-sm font-medium text-gray-700">Admin Account</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.adminFirstName} onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })} />
            <Input label="Last Name" value={form.adminLastName} onChange={(e) => setForm({ ...form, adminLastName: e.target.value })} />
          </div>
          <Input label="Admin Email" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
          <Input label="Password" type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={createMutation.isLoading}>Create Tenant</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
