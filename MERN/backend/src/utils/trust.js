const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const TRUST_EVENTS = {
  EMAIL_VERIFIED: 10,
  PHONE_VERIFIED: 15,
  ID_VERIFIED: 30,
  SUCCESSFUL_RETURN: 50,
  SCAM_REPORTED: -100,
};

const getTrustBadge = (score = 0) => {
  if (score >= 80) return 'trusted_finder';
  if (score <= -20) return 'suspicious';
  return 'basic_user';
};

const applyTrustEvent = (user, eventKey) => {
  if (!user || !Object.prototype.hasOwnProperty.call(TRUST_EVENTS, eventKey)) return user;
  const current = Number(user.trustScore || 0);
  user.trustScore = clamp(current + TRUST_EVENTS[eventKey], -200, 300);
  user.trustBadge = getTrustBadge(user.trustScore);
  return user;
};

module.exports = {
  TRUST_EVENTS,
  getTrustBadge,
  applyTrustEvent,
};
