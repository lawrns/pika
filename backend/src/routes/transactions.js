import express from 'express';
import { Transaction } from '../models/Transaction.js';
import { authenticateToken, requireVerified } from '../middleware/auth.js';
import { generalApiLimiter } from '../middleware/rateLimiter.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * Get transaction history with filters and pagination
 * GET /api/transactions
 */
router.get('/',
  authenticateToken,
  generalApiLimiter,
  async (req, res) => {
    try {
      const {
        limit = 20,
        offset = 0,
        type,
        status,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search
      } = req.query;

      // Build query with filters
      let query = 'SELECT * FROM transactions WHERE user_id = $1';
      const params = [req.user.id];
      let paramIndex = 2;

      if (type) {
        query += ` AND type = $${paramIndex++}`;
        params.push(type);
      }

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      if (startDate) {
        query += ` AND created_at >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND created_at <= $${paramIndex++}`;
        params.push(endDate);
      }

      if (minAmount) {
        query += ` AND amount >= $${paramIndex++}`;
        params.push(parseInt(minAmount));
      }

      if (maxAmount) {
        query += ` AND amount <= $${paramIndex++}`;
        params.push(parseInt(maxAmount));
      }

      if (search) {
        query += ` AND (description ILIKE $${paramIndex} OR reference_code ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM (${query}) as filtered`,
        params
      );
      const totalCount = parseInt(countResult.rows[0].count);

      // Add sorting and pagination
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      // Get summary statistics
      const summaryResult = await pool.query(
        `SELECT
          COUNT(*) as total_count,
          COALESCE(SUM(CASE WHEN type = 'PAYMENT' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as total_payments_received,
          COALESCE(SUM(CASE WHEN type = 'TRANSFER' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as total_transfers,
          COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as pending_amount
         FROM transactions
         WHERE user_id = $1`,
        [req.user.id]
      );

      res.json({
        transactions: result.rows.map(tx => ({
          id: tx.id,
          type: tx.type,
          status: tx.status,
          amount: tx.amount,
          fee: tx.fee,
          netAmount: tx.net_amount,
          currency: tx.currency,
          description: tx.description,
          referenceCode: tx.reference_code,
          provider: tx.provider,
          providerTxId: tx.provider_tx_id,
          counterpartyInfo: tx.counterparty_info,
          metadata: tx.metadata,
          createdAt: tx.created_at,
          completedAt: tx.completed_at,
          failedAt: tx.failed_at
        })),
        summary: summaryResult.rows[0],
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + result.rows.length < totalCount
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }
);

/**
 * Get transaction details by ID
 * GET /api/transactions/:id
 */
router.get('/:id',
  authenticateToken,
  generalApiLimiter,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT t.*, 
          u.email as counterparty_email,
          u.name as counterparty_name
         FROM transactions t
         LEFT JOIN users u ON u.id = (
           CASE 
             WHEN t.counterparty_info->>'userId' IS NOT NULL 
             THEN t.counterparty_info->>'userId'
             ELSE NULL
           END
         )::uuid
         WHERE t.id = $1 AND t.user_id = $2`,
        [req.params.id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = result.rows[0];

      // Get related transaction if this is a transfer
      let relatedTransaction = null;
      if (transaction.type === 'TRANSFER') {
        const relatedResult = await pool.query(
          `SELECT t.*, u.email, u.name
           FROM transactions t
           JOIN users u ON u.id = t.user_id
           WHERE t.reference_code = $1 
           AND t.user_id != $2
           LIMIT 1`,
          [transaction.reference_code, req.user.id]
        );
        if (relatedResult.rows.length > 0) {
          relatedTransaction = {
            id: relatedResult.rows[0].id,
            userId: relatedResult.rows[0].user_id,
            email: relatedResult.rows[0].email,
            name: relatedResult.rows[0].name,
            type: relatedResult.rows[0].type,
            amount: relatedResult.rows[0].amount
          };
        }
      }

      res.json({
        transaction: {
          id: transaction.id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          fee: transaction.fee,
          netAmount: transaction.net_amount,
          currency: transaction.currency,
          description: transaction.description,
          referenceCode: transaction.reference_code,
          provider: transaction.provider,
          providerTxId: transaction.provider_tx_id,
          paymentMethod: transaction.payment_method,
          counterpartyInfo: transaction.counterparty_info,
          counterparty: transaction.counterparty_email ? {
            email: transaction.counterparty_email,
            name: transaction.counterparty_name
          } : null,
          metadata: transaction.metadata,
          createdAt: transaction.created_at,
          completedAt: transaction.completed_at,
          failedAt: transaction.failed_at,
          refundedAt: transaction.refunded_at
        },
        relatedTransaction
      });
    } catch (error) {
      console.error('Get transaction details error:', error);
      res.status(500).json({ error: 'Failed to fetch transaction details' });
    }
  }
);

/**
 * Export transactions to CSV/JSON
 * GET /api/transactions/export
 */
router.get('/export',
  authenticateToken,
  requireVerified,
  generalApiLimiter,
  async (req, res) => {
    try {
      const {
        format = 'json',
        startDate,
        endDate,
        type,
        status
      } = req.query;

      // Build query
      let query = 'SELECT * FROM transactions WHERE user_id = $1';
      const params = [req.user.id];
      let paramIndex = 2;

      if (startDate) {
        query += ` AND created_at >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND created_at <= $${paramIndex++}`;
        params.push(endDate);
      }

      if (type) {
        query += ` AND type = $${paramIndex++}`;
        params.push(type);
      }

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'ID',
          'Date',
          'Type',
          'Status',
          'Amount',
          'Fee',
          'Net Amount',
          'Currency',
          'Description',
          'Reference Code',
          'Provider',
          'Completed At'
        ];

        const rows = result.rows.map(tx => [
          tx.id,
          tx.created_at,
          tx.type,
          tx.status,
          (tx.amount / 100).toFixed(2),
          (tx.fee / 100).toFixed(2),
          (tx.net_amount / 100).toFixed(2),
          tx.currency,
          tx.description || '',
          tx.reference_code || '',
          tx.provider || '',
          tx.completed_at || ''
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } else {
        // JSON format
        const exportData = {
          exportedAt: new Date().toISOString(),
          userId: req.user.id,
          filter: { startDate, endDate, type, status },
          count: result.rows.length,
          transactions: result.rows.map(tx => ({
            id: tx.id,
            createdAt: tx.created_at,
            type: tx.type,
            status: tx.status,
            amount: tx.amount,
            fee: tx.fee,
            netAmount: tx.net_amount,
            currency: tx.currency,
            description: tx.description,
            referenceCode: tx.reference_code,
            provider: tx.provider,
            completedAt: tx.completed_at
          }))
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.json"`);
        res.json(exportData);
      }
    } catch (error) {
      console.error('Export transactions error:', error);
      res.status(500).json({ error: 'Failed to export transactions' });
    }
  }
);

/**
 * Get transaction statistics
 * GET /api/transactions/stats
 */
router.get('/stats',
  authenticateToken,
  generalApiLimiter,
  async (req, res) => {
    try {
      const { period = 'month' } = req.query;

      let dateTrunc;
      switch (period) {
        case 'day':
          dateTrunc = 'day';
          break;
        case 'week':
          dateTrunc = 'week';
          break;
        case 'month':
        default:
          dateTrunc = 'month';
          break;
        case 'year':
          dateTrunc = 'year';
          break;
      }

      const result = await pool.query(
        `SELECT
          DATE_TRUNC($1, created_at) as period,
          type,
          status,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          SUM(fee) as total_fees,
          AVG(amount) as avg_amount
         FROM transactions
         WHERE user_id = $2
           AND created_at >= NOW() - INTERVAL '1 year'
         GROUP BY DATE_TRUNC($1, created_at), type, status
         ORDER BY period DESC, type, status`,
        [dateTrunc, req.user.id]
      );

      // Get overall stats
      const overallResult = await pool.query(
        `SELECT
          COUNT(*) as total_transactions,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as transactions_last_30d,
          SUM(amount) FILTER (WHERE status = 'COMPLETED' AND type = 'PAYMENT') as total_payments_received,
          SUM(amount) FILTER (WHERE status = 'COMPLETED' AND type = 'TRANSFER') as total_transfers,
          SUM(fee) as total_fees_paid
         FROM transactions
         WHERE user_id = $1`,
        [req.user.id]
      );

      res.json({
        period,
        overall: overallResult.rows[0],
        breakdown: result.rows
      });
    } catch (error) {
      console.error('Get transaction stats error:', error);
      res.status(500).json({ error: 'Failed to fetch transaction statistics' });
    }
  }
);

export default router;
