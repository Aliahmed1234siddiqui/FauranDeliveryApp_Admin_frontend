// Online riders are either free for a new order or out on one.
export const riderNowStatus = (r) => (!r.isOnline ? 'offline' : r.isAvailable ? 'available' : 'busy');
