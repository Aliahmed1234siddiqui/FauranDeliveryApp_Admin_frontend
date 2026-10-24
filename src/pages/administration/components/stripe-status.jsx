import { Badge, Card, KeyValue } from '@/components/ui';

export function StripeStatus({ stripe = {} }) {
  const yesNo = (on, yes, no) => (
    <Badge tone={on ? 'success' : 'warning'} dot>
      {on ? yes : no}
    </Badge>
  );
  return (
    <Card title="Card payments (Stripe)" subtitle="Read-only. Set up on the server.">
      <KeyValue
        items={[
          ['API keys', yesNo(stripe.configured, 'Configured', 'Not configured')],
          ['Webhook', yesNo(stripe.webhookConfigured, 'Configured', 'Not configured')],
          ['Currency', stripe.currency?.toUpperCase()],
        ]}
      />
    </Card>
  );
}
