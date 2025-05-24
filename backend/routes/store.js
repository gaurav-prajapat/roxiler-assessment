const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all store owner routes
router.use(auth);
router.use(requireRole(['store_owner']));

// Get store owner dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    
    // Get store information for this owner
    const stores = await db.query(`
      SELECT 
        s.id, 
        s.name, 
        s.address, 
        s.email,
        AVG(r.rating) as averageRating,
        COUNT(r.id) as totalRatings
      FROM stores s 
      LEFT JOIN ratings r ON s.id = r.store_id 
      WHERE s.owner_id = ?
      GROUP BY s.id
      LIMIT 1
    `, [userId]);
    
    if (!stores || stores.length === 0) {
      return res.status(404).json({ message: 'Store not found for this owner' });
    }
    
    const store = stores[0];
    
    res.json({
      id: store.id,
      name: store.name,
      address: store.address,
      email: store.email,
      averageRating: store.averageRating ? parseFloat(store.averageRating) : 0,
      totalRatings: parseInt(store.totalRatings) || 0
    });
  } catch (error) {
    console.error('Store dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch store dashboard data' });
  }
});

// Get ratings for store owner's store
router.get('/ratings', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      page = 1, 
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;
    
    // First get the store ID for this owner
    const stores = await db.query('SELECT id FROM stores WHERE owner_id = ?', [userId]);
    
    if (!stores || stores.length === 0) {
      return res.status(404).json({ message: 'Store not found for this owner' });
    }
    
    const storeId = stores[0].id;
    
    // Validate sort parameters
    const validSortColumns = ['created_at', 'rating', 'userName'];
    const sortColumn = validSortColumns.includes(sortBy) ? 
      (sortBy === 'userName' ? 'u.name' : `r.${sortBy}`) : 'r.created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    const offset = (page - 1) * limit;
    
    // Get ratings with user information
    const ratings = await db.query(`
      SELECT 
        r.id, 
        r.rating, 
        r.created_at,
        u.name as userName,
        u.email as userEmail
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `, [storeId, parseInt(limit), parseInt(offset)]);
    
    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM ratings WHERE store_id = ?',
      [storeId]
    );
    
    const totalCount = countResult && countResult.length > 0 ? countResult[0].count : 0;
    
    res.json({
      data: ratings || [],
      totalCount: parseInt(totalCount),
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Store ratings error:', error);
    res.status(500).json({ message: 'Failed to fetch store ratings' });
  }
});

module.exports = router;
