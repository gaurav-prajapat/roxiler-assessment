const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all admin routes
router.use(auth);
router.use(requireRole(['system_admin']));

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users count
    const userCountResult = await db.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = userCountResult && userCountResult.length > 0 ? parseInt(userCountResult[0].count) : 0;

    // Get total stores count
    const storeCountResult = await db.query('SELECT COUNT(*) as count FROM stores');
    const totalStores = storeCountResult && storeCountResult.length > 0 ? parseInt(storeCountResult[0].count) : 0;

    // Get total ratings count
    const ratingsCountResult = await db.query('SELECT COUNT(*) as count FROM ratings');
    const totalRatings = ratingsCountResult && ratingsCountResult.length > 0 ? parseInt(ratingsCountResult[0].count) : 0;

    res.json({
      totalUsers,
      totalStores,
      totalRatings
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// Get users with filtering and pagination
router.get('/users', async (req, res) => {
  try {
    const { 
      search = '', 
      role = '', 
      sortBy = 'created_at', 
      sortOrder = 'desc', 
      page = 1, 
      limit = 10 
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR address LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    const validSortColumns = ['name', 'email', 'role', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const users = await db.query(`
      SELECT id, name, email, address, role, created_at, updated_at 
      FROM users 
      ${whereClause} 
      ORDER BY ${sortColumn} ${order} 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const countResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM users 
      ${whereClause}
    `, params);

    const totalCount = countResult && countResult.length > 0 ? countResult[0].count : 0;

    res.json({
      data: users || [],
      totalCount: parseInt(totalCount),
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/users', [
  body('name').isLength({ min: 20, max: 60 }).withMessage('Name must be between 20-60 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8, max: 16 })
    .withMessage('Password must be between 8-16 characters')
    .matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain at least one uppercase letter and one special character'),
  body('address').isLength({ max: 400 }).withMessage('Address must not exceed 400 characters'),
  body('role').isIn(['system_admin', 'user', 'store_owner']).withMessage('Invalid role'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, password, address, role } = req.body;

    const existingUser = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, address, role]
    );

    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.insertId 
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Get stores with filtering and pagination
router.get('/stores', async (req, res) => {
  try {
    const { 
      search = '', 
      sortBy = 'created_at', 
      sortOrder = 'desc', 
      page = 1, 
      limit = 10 
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (s.name LIKE ? OR s.email LIKE ? OR s.address LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const validSortColumns = ['name', 'email', 'created_at', 'averageRating'];
    const sortColumn = validSortColumns.includes(sortBy) ? 
      (sortBy === 'averageRating' ? 'AVG(r.rating)' : `s.${sortBy}`) : 's.created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const stores = await db.query(`
      SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.address, 
        s.created_at,
        u.name as ownerName,
        u.email as ownerEmail,
        AVG(r.rating) as averageRating,
        COUNT(r.id) as totalRatings
      FROM stores s 
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id 
      ${whereClause}
      GROUP BY s.id 
      ORDER BY ${sortColumn} ${order} 
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const countResult = await db.query(`
      SELECT COUNT(DISTINCT s.id) as count 
      FROM stores s 
      LEFT JOIN users u ON s.owner_id = u.id
      ${whereClause}
    `, params);

    const totalCount = countResult && countResult.length > 0 ? countResult[0].count : 0;

    res.json({
      data: stores || [],
      totalCount: parseInt(totalCount),
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Failed to fetch stores' });
  }
});

// Create new store
router.post('/stores', [
  body('name').notEmpty().withMessage('Store name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('address').isLength({ max: 400 }).withMessage('Address must not exceed 400 characters'),
  body('ownerEmail').isEmail().withMessage('Please provide a valid owner email'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, email, address, ownerEmail } = req.body;

    const existingStore = await db.query('SELECT id FROM stores WHERE email = ?', [email]);
    if (existingStore && existingStore.length > 0) {
      return res.status(400).json({ message: 'Store already exists with this email' });
    }

    const owner = await db.query(
      'SELECT id FROM users WHERE email = ? AND role = ?', 
      [ownerEmail, 'store_owner']
    );

    if (!owner || owner.length === 0) {
      return res.status(400).json({ 
        message: 'Owner not found or user is not a store owner' 
      });
    }

    const result = await db.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
      [name, email, address, owner[0].id]
    );

    res.status(201).json({ 
      message: 'Store created successfully',
      storeId: result.insertId 
    });

  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ message: 'Failed to create store' });
  }
});

module.exports = router;
