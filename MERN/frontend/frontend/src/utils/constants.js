export const ROLES = {
  OWNER: 'owner',
  FINDER: 'finder',
  ADMIN: 'admin',
};

export const REQUEST_STATUSES = ['pending_payment', 'open', 'assigned', 'completed', 'found', 'cancelled'];

export const TRACKING_STATUSES = ['searching', 'near_location', 'item_found', 'search_failed'];

export const DISPUTE_REASONS = [
  'wrong_item',
  'fake_evidence',
  'incomplete_item',
  'payment_not_released',
  'unfair_rejection',
];

export const USER_STATUSES = ['active', 'suspended', 'blocked'];
