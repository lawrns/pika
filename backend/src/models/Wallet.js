// Pika is orchestration-only: it never holds customer balances and is not a wallet
// (see docs/specs section 2 & 20). This module returns synthetic zero-balance shapes
// needed only so the auth flow has a stable data contract.

function syntheticWallet(userId, currency = 'MXN') {
  return {
    id: `wallet_${userId}`,
    user_id: userId,
    balance: 0,
    currency,
    is_active: true,
    daily_limit: null,
    monthly_limit: null
  };
}

export class Wallet {
  static async create(userId, options = {}) {
    return syntheticWallet(userId, options.currency || 'MXN');
  }

  static async findByUserId(userId) {
    return syntheticWallet(userId);
  }
}

export default Wallet;
