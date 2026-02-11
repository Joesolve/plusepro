'use client';
import { useApi, useMutation } from '@/hooks/use-api';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PLAN_INFO } from '@/lib/utils';
import type { Subscription, SubscriptionPlan } from '@/types';

const PLANS: { plan: SubscriptionPlan; name: string; price: number; employees: number; features: string[] }[] = [
  { plan: 'STARTER', name: 'Starter', price: 49, employees: 25, features: ['Up to 25 employees', 'Pulse surveys', 'Suggestions box', 'Basic analytics'] },
  { plan: 'GROWTH', name: 'Growth', price: 149, employees: 100, features: ['Up to 100 employees', 'All Starter features', 'Self-assessments', 'Recognition module', 'Advanced analytics'] },
  { plan: 'SCALE', name: 'Scale', price: 349, employees: 500, features: ['Up to 500 employees', 'All Growth features', 'Priority support', 'Custom branding', 'API access'] },
];

export default function BillingPage() {
  const { data: subscription } = useApi<Subscription>('/subscriptions');
  const { mutate: createCheckout, isLoading: checkingOut } = useMutation<{ url?: string }>('post', '/subscriptions/checkout');
  const { mutate: cancelSub, isLoading: canceling } = useMutation('post', '/subscriptions/cancel');

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    const result = await createCheckout({ plan });
    if (result?.url) window.location.href = result.url;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your subscription plan</p>
      </div>

      {/* Current plan */}
      {subscription && (
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-900">{PLAN_INFO[subscription.plan]?.name || subscription.plan}</p>
              <p className="text-sm text-gray-500">${PLAN_INFO[subscription.plan]?.price || 0}/month &middot; Up to {subscription.maxEmployees} employees</p>
              <Badge status={subscription.status} className="mt-2" />
              {subscription.cancelAtPeriodEnd && (
                <p className="text-sm text-red-600 mt-1">Cancels at end of current period</p>
              )}
            </div>
            {!subscription.cancelAtPeriodEnd && subscription.status === 'ACTIVE' && (
              <Button variant="outline" size="sm" onClick={() => cancelSub({})} isLoading={canceling}>
                Cancel Plan
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Plan options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((p) => {
          const isCurrent = subscription?.plan === p.plan;
          return (
            <Card key={p.plan} className={isCurrent ? 'border-2 border-accent' : ''}>
              {isCurrent && <span className="text-xs font-medium text-accent">Current Plan</span>}
              <h3 className="text-xl font-bold text-gray-900 mt-1">{p.name}</h3>
              <p className="text-3xl font-bold text-primary mt-2">${p.price}<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-500 mt-1">Up to {p.employees} employees</p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-6"
                variant={isCurrent ? 'outline' : 'primary'}
                disabled={isCurrent}
                isLoading={checkingOut}
                onClick={() => handleUpgrade(p.plan)}
              >
                {isCurrent ? 'Current' : 'Upgrade'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
