const db = require('../config/database');

const storeController = {
  // Get all stores with filtering and pagination
  getAllStores: async (req, res) => {
    try {
      const { 
        search = '', 
        sortBy = 'name', 
        sortOrder = 'asc', 
        page = 1, 
        limit = 12 
      } = req.query;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      
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
          s.created_at
        FROM stores s 
        LEFT JOIN ratings r ON s.id = r.store_id 
        ${whereClause}
        GROUP BY s.id 
        ORDER BY ${sortColumn} ${order} 
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), parseInt(offset)]);
      
      const countResult = await db.query(
        `SELECT COUNT(DISTINCT s.id) as count FROM stores s ${whereClause}`,
        params
      );
      
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
  },

  // Get store by ID with detailed information
  getStoreById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const stores = await db.query(`
        SELECT 
          s.id, 
          s.name, 
          s.address, 
          s.email,
          s.owner_id,
          AVG(r.rating) as averageRating,
          COUNT(r.id) as totalRatings,
          s.created_at,
          u.name as ownerName,
          u.email as ownerEmail
        FROM stores s 
        LEFT JOIN ratings r ON s.id = r.store_id 
        LEFT JOIN users u ON s.owner_id = u.id
        WHERE s.id = ?
        GROUP BY s.id
      `, [id]);
      
      if (!stores || stores.length === 0) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      res.json(stores[0]);
    } catch (error) {
      console.error('Get store by ID error:', error);
      res.status(500).json({ message: 'Failed to fetch store' });
    }
  },

  // Get store ratings with pagination
  getStoreRatings: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      
      // Check if store exists
      const stores = await db.query('SELECT id FROM stores WHERE id = ?', [id]);
      if (!stores || stores.length === 0) {
        return res.status(404).json({ message: 'Store not found' });
      }
      
      const ratings = await db.query(`
        SELECT 
          r.id, 
          r.rating, 
          r.created_at,
          u.name as userName
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.store_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `, [id, parseInt(limit), parseInt(offset)]);
      
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM ratings WHERE store_id = ?',
        [id]
      );
      
      const totalCount = countResult && countResult.length > 0 ? countResult[0].count : 0;
      
      res.json({
        data: ratings || [],
        totalCount: parseInt(totalCount),
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error('Get store ratings error:', error);
      res.status(500).json({ message: 'Failed to fetch store ratings' });
    }
  },

  // Get dashboard statistics for stores
  getStoreStats: async (req, res) => {
    try {
      // Get total stores count
      const storeCountResult = await db.query('SELECT COUNT(*) as count FROM stores');
      const totalStores = storeCountResult && storeCountResult.length > 0 ? parseInt(storeCountResult[0].count) : 0;

      // Get total ratings count
      const ratingsCountResult = await db.query('SELECT COUNT(*) as count FROM ratings');
      const totalRatings = ratingsCountResult && ratingsCountResult.length > 0 ? parseInt(ratingsCountResult[0].count) : 0;

      // Get average rating across all stores
      const avgRatingResult = await db.query('SELECT AVG(rating) as avgRating FROM ratings');
      const averageRating = avgRatingResult && avgRatingResult.length > 0 && avgRatingResult[0].avgRating ? 
        parseFloat(avgRatingResult[0].avgRating) : 0;

      // Get top rated stores
      const topStores = await db.query(`
        SELECT 
          s.id, 
          s.name, 
          s.address,
          AVG(r.rating) as averageRating,
          COUNT(r.id) as totalRatings
        FROM stores s 
        LEFT JOIN ratings r ON s.id = r.store_id 
        GROUP BY s.id 
        HAVING COUNT(r.id) > 0
        ORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC
        LIMIT 5
      `);

      // Get recent ratings
      const recentRatings = await db.query(`
        SELECT 
          r.id, 
          r.rating, 
          r.created_at,
          s.name as storeName,
          u.name as userName
        FROM ratings r
        JOIN stores s ON r.store_id = s.id
        JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
        LIMIT 10
      `);

      res.json({
        totalStores,
        totalRatings,
        averageRating: averageRating ? parseFloat(averageRating.toFixed(1)) : 0,
        topStores: topStores || [],
        recentRatings: recentRatings || []
      });
    } catch (error) {
      console.error('Get store stats error:', error);
      res.status(500).json({ message: 'Failed to fetch store statistics' });
    }
  },

  // Get stores with user-specific data (for authenticated users)
  getStoresForUser: async (req, res) => {
    try {
      const { 
        search = '', 
        sortBy = 'name', 
        sortOrder = 'asc', 
        page = 1, 
        limit = 12 
      } = req.query;
      
      const userId = req.user?.userId || req.user?.id;
      
      let whereClause = 'WHERE 1=1';
      const params = userId ? [userId] : [];
      
      if (search) {
        whereClause += ' AND (s.name LIKE ? OR s.address LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      const validSortColumns = ['name', 'averageRating', 'created_at'];
      const sortColumn = validSortColumns.includes(sortBy) ? 
        (sortBy === 'averageRating' ? 'AVG(r.rating)' : `s.${sortBy}`) : 's.name';
      const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          s.id, 
          s.name, 
          s.address, 
          s.email,
          AVG(r.rating) as averageRating,
          COUNT(r.id) as totalRatings,
          s.created_at
      `;
      
      if (userId) {
        query += `, ur.rating as userRating`;
      }
      
      query += `
        FROM stores s 
        LEFT JOIN ratings r ON s.id = r.store_id 
      `;
      
      if (userId) {
        query += `LEFT JOIN ratings ur ON s.id = ur.store_id AND ur.user_id = ? `;
      }
      
      query += `
        ${whereClause}
        GROUP BY s.id 
        ORDER BY ${sortColumn} ${order} 
        LIMIT ? OFFSET ?
      `;
      
      const stores = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);
      
      const countParams = userId ? params.slice(1) : params;
      const countResult = await db.query(
        `SELECT COUNT(DISTINCT s.id) as count FROM stores s ${whereClause}`,
        countParams
      );
      
      const totalCount = countResult && countResult.length > 0 ? countResult[0].count : 0;
      
      res.json({
        data: stores || [],
        totalCount: parseInt(totalCount),
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error('Get stores for user error:', error);
      res.status(500).json({ message: 'Failed to fetch stores' });
    }
  },

  // Get store owner dashboard data - NEW METHOD
  getStoreDashboard: async (req, res) => {
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
  },

  // Get ratings for store owner's store - NEW METHOD
  getStoreOwnerRatings: async (req, res) => {
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
  }
};

module.exports = storeController;

