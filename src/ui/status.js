// Backend status value -> [badge tone, human label]. One map for every status
// the API returns (approval, account, rider, order, payment, settlement, stock).
export const STATUS = {
  approved: ['success', 'Approved'], pending: ['warning', 'Pending review'], rejected: ['danger', 'Rejected'],
  active: ['success', 'Active'], inactive: ['neutral', 'Inactive'], blocked: ['danger', 'Blocked'],
  online: ['success', 'Online'], offline: ['neutral', 'Offline'], idle: ['info', 'Idle'], delivering: ['brand', 'On delivery'],
  placed: ['info', 'Placed'], accepted: ['info', 'Accepted'], preparing: ['warning', 'Preparing'], ready: ['warning', 'Ready'],
  rider_assigned: ['violet', 'Rider assigned'], picked_up: ['violet', 'Picked up'], on_the_way: ['brand', 'On the way'],
  delivered: ['success', 'Delivered'], cancelled: ['danger', 'Cancelled'], return_requested: ['warning', 'Return requested'], returned: ['neutral', 'Returned'],
  paid: ['success', 'Paid'], refunded: ['violet', 'Refunded'], failed: ['danger', 'Failed'], void: ['neutral', 'Void'],
  completed: ['success', 'Completed'], payout: ['brand', 'Payout'], cash_deposit: ['info', 'Cash deposit'],
  in_stock: ['success', 'In stock'], low: ['warning', 'Low stock'], out: ['danger', 'Out of stock'],
};

export const statusLabel = (status) => STATUS[status]?.[1] || status;
