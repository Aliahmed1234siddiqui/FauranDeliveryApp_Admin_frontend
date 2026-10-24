import { FAILURE_REASONS, PAYMENT_METHODS } from '@/constants';
import { titleCase } from '@/utils/format';

export const failureLabel = (reason) => (reason ? FAILURE_REASONS[reason] || titleCase(reason) : null);

export const methodLabel = (m) => PAYMENT_METHODS[m] || m;
