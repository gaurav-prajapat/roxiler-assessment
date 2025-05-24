const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const storeController = require('../controllers/storeController');
const router = express.Router();

// Apply auth middleware to all user routes
router.use(auth);
router.use(requireRole(['normal_user']));

// Get user statistics for dashboard
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Get user's ratings count
    const userRatingsResult = await db.query('SELECT COUNT(*) as count FROM ratings WHERE user_id = ?', [userId]);
    const myRatings = userRatingsResult && userRatingsResult.length > 0 ? parseInt(userRatingsResult[0].count) : 0;

    // Get user's average rating
    const avgRatingResult = await db.query('SELECT AVG(rating) as avgRating FROM ratings WHERE user_id = ?', [userId]);
    const averageRating = avgRatingResult && avgRatingResult.length > 0 && avgRatingResult[0].avgRating ? 
      parseFloat(avgRatingResult[0].avgRating) : 0;

    // Get total stores count
    const storeCountResult = await db.query('SELECT COUNT(*) as count FROM stores');
    const totalStores = storeCountResult && storeCountResult.length > 0 ? parseInt(storeCountResult[0].count) : 0;

    // Get user's recent ratings
    const recentRatings = await db.query(`
      SELECT 
        r.id, 
        r.rating, 
        r.created_at,
        s.name as storeName,
        s.address as storeAddress
      FROM ratings r
      JOIN stores s ON r.store_id = s.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [userId]);

    res.json({
      totalStores,
      myRatings,
      averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : 0,
      recentRatings: recentRatings || []
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

// Get stores with user ratings
router.get('/stores', async (req, res) => {
  try {
    const { 
      search = '', 
      sortBy = 'name', 
      sortOrder = 'asc', 
      page = 1, 
      limit = 12 
    } = req.query;
    
    const userId = req.user.userId || req.user.id;
    
    let whereClause = 'WHERE 1=1';
    const params = [userId];
    
    if (search) {
      whereClause += ' AND (s.name LIKE ? OR s.address LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const validSortColumns = ['name', 'averageRating', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? 
      (sortBy === 'averageRating' ? 'AVG(r.rating)' : `s.${sortBy}`) : 's.name';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    const offset = (page - 1) * limit;
    
    const stores = await db.query(`
      SELECT 
        s.id, 
        s.name, 
        s.address, 
        s.email,
        AVG(r.rating) as averageRating,
        COUNT(r.id) as totalRatings,
        ur.rating as userRating
      FROM stores s 
      LEFT JOIN ratings r ON s.id = r.store_id 
      LEFT JOIN ratings ur ON s.id = ur.store_id AND ur.user_id = ?
      ${whereClause}
      GROUP BY s.id 
      ORDER BY ${sortColumn} ${order} 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);
    
    const countResult = await db.query(
      `SELECT COUNT(DISTINCT s.id) as count FROM stores s ${whereClause.replace('ur.user_id = ?', '1=1')}`,
      params.slice(1)
    );
    
    const totalCount = countResult && countResult.length > 0 ? countResult[0].count : 0;
    
    res.json({
      data: stores || [],
      totalCount: parseInt(totalCount),
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get user stores error:', error);
    res.status(500).json({ message: 'Failed to fetch stores' });
  }
});

// Submit rating for a store
router.post('/stores/:storeId/rating', [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { storeId } = req.params;
    const { rating } = req.body;
    const userId = req.user.userId || req.user.id;

    // Check if store exists
    const stores = await db.query('SELECT id FROM stores WHERE id = ?', [storeId]);
    if (!stores || stores.length === 0) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if user already rated this store
    const existingRating = await db.query(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [userId, storeId]
    );

    if (existingRating && existingRating.length > 0) {
      return res.status(400).json({ message: 'You have already rated this store. Use update rating instead.' });
    }

    // Insert new rating
    await db.query(
      'INSERT INTO ratings (user_id, store_id, rating, created_at) VALUES (?, ?, ?, NOW())',
      [userId, storeId, rating]
    );

    res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

// Update existing rating
router.put('/stores/:storeId/rating', [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { storeId } = req.params;
    const { rating } = req.body;
    const userId = req.user.userId || req.user.id;

    // Check if rating exists
    const existingRating = await db.query(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [userId, storeId]
    );

    if (!existingRating || existingRating.length === 0) {
      return res.status(404).json({ message: 'Rating not found. Submit a new rating instead.' });
    }

    // Update rating
    await db.query(
      'UPDATE ratings SET rating = ?, updated_at = NOW() WHERE user_id = ? AND store_id = ?',
      [rating, userId, storeId]
    );

    res.json({ message: 'Rating updated successfully' });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ message: 'Failed to update rating' });
  }
});

// Get user's ratings
router.get('/my-ratings', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.userId || req.user.id;
    const offset = (page - 1) * limit;

    const ratings = await db.query(`
      SELECT 
        r.id, 
        r.rating, 
        r.created_at, 
        r.updated_at,
        s.id as storeId,
        s.name as storeName, 
        s.address as storeAddress
      FROM ratings r
      JOIN stores s ON r.store_id = s.id
      WHERE r.user_id = ?
      ORDER BY r.updated_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM ratings WHERE user_id = ?',
      [userId]
    );

    const totalCount = countResult && countResult.length > 0 ? countResult[0].count : 0;

    res.json({
      data: ratings || [],
      totalCount: parseInt(totalCount),
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get my ratings error:', error);
    res.status(500).json({ message: 'Failed to fetch your ratings' });
  }
});

module.exports = router;
