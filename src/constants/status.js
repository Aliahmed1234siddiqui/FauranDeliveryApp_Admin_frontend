// Backend status value -> [badge tone, human label]. One map for every status
// the API returns (approval, account, order, payment, settlement, stock).
export const STATUS = {
  // approval / account
  approved: ['success', 'Approved'],
  pending: ['warning', 'Pending'],
  rejected: ['danger', 'Rejected'],
  active: ['success', 'Active'],
  inactive: ['neutral', 'Inactive'],
  blocked: ['danger', 'Blocked'],
  online: ['success', 'Online'],
  offline: ['neutral', 'Offline'],
  busy: ['brand', 'On delivery'],
  available: ['info', 'Available'],

  // order lifecycle
  placed: ['info', 'Placed'],
  accepted: ['info', 'Accepted'],
  preparing: ['warning', 'Preparing'],
  ready: ['warning', 'Ready'],
  rider_assigned: ['violet', 'Rider assigned'],
  picked_up: ['violet', 'Picked up'],
  on_the_way: ['brand', 'On the way'],
  delivered: ['success', 'Delivered'],
  cancelled: ['danger', 'Cancelled'],
  delivery_failed: ['warning', 'Delivery failed'],
  returned: ['neutral', 'Returned'],

  // payments (order paymentStatus + payment record status)
  paid: ['success', 'Paid'],
  succeeded: ['success', 'Succeeded'],
  refunded: ['violet', 'Refunded'],
  failed: ['danger', 'Failed'],

  // settlements
  payout: ['brand', 'Payout'],
  cash_deposit: ['info', 'Cash deposit'],

  // stock
  in_stock: ['success', 'In stock'],
  low: ['warning', 'Low stock'],
  out: ['danger', 'Out of stock'],
};

export const statusLabel = (status) => STATUS[status]?.[1] || status;
