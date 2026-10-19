// Option lists for filters and forms. Values are exactly what the API accepts.

export const ORDER_STATUSES = [
  'placed', 'accepted', 'preparing', 'ready', 'rider_assigned', 'picked_up',
  'on_the_way', 'delivered', 'cancelled', 'delivery_failed', 'returned',
];

// Orders the admin may still cancel (handbook 8: "before pickup").
export const CANCELLABLE_STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'rider_assigned'];

// Statuses that end an order.
export const FINISHED_STATUSES = ['delivered', 'cancelled', 'returned'];

export const PAYMENT_METHODS = { stripe: 'Card', cod: 'Cash on delivery' };

export const ORDER_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
export const PAYMENT_RECORD_STATUSES = ['pending', 'succeeded', 'failed', 'refunded'];

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

export const SETTLEMENT_METHOD_LABELS = {
  bank_transfer: 'Bank transfer', cash: 'Cash', easypaisa: 'Easypaisa', jazzcash: 'JazzCash', other: 'Other',
};

export const FAILURE_REASONS = {
  customer_unreachable: 'Customer not reachable',
};

export const REPORT_GROUP_BY = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

/** Build a `{ value, label }` options list with an "All" entry first. */
export const withAll = (allLabel, values, labelOf = (v) => v) => [
  { value: 'all', label: allLabel },
  ...values.map((v) => ({ value: v, label: labelOf(v) })),
];
