import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage';
import RatingModal from './RatingModal';

const StoreList = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchStores();
  }, [filters]);

  // Auto-clear success/error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getStores(filters);
      setStores(response.data.data || []);
      setPagination({
        totalCount: response.data.totalCount || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: response.data.currentPage || 1
      });
    } catch (err) {
      console.error('Fetch stores error:', err);
      setError(err.response?.data?.message || 'Failed to fetch stores');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page }));
    }
  };

  const handleRateStore = (store) => {
    setSelectedStore(store);
    setShowRatingModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmitRating = async (rating) => {
    try {
      setError('');
      setSuccess('');
      
      if (selectedStore.userRating) {
        // Update existing rating
        await userAPI.updateRating(selectedStore.id, { rating });
        setSuccess(`Rating updated to ${rating} stars for ${selectedStore.name}!`);
      } else {
        // Submit new rating
        await userAPI.submitRating(selectedStore.id, { rating });
        setSuccess(`Rating of ${rating} stars submitted for ${selectedStore.name}!`);
      }
      
      setShowRatingModal(false);
      setSelectedStore(null);
      fetchStores(); // Refresh the list to show updated ratings
    } catch (err) {
      console.error('Submit rating error:', err);
      setError(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  const handleCloseModal = () => {
    setShowRatingModal(false);
    setSelectedStore(null);
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    const numRating = Math.round(Number(rating) || 0);
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`${size} ${i < numRating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ));
  };

  const clearSearch = () => {
    handleFilterChange('search', '');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
        <p className="mt-2 text-gray-600">Browse and rate stores on our platform</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <SuccessMessage message={success} />
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Name or Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search stores..."
              />
              {filters.search && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Store Name</option>
              <option value="averageRating">Rating</option>
              <option value="created_at">Date Added</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="mt-4 text-sm text-gray-600">
            {pagination.totalCount > 0 ? (
              <>
                Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * filters.limit, pagination.totalCount)} of{' '}
                {pagination.totalCount} stores
                {filters.search && ` matching "${filters.search}"`}
              </>
            ) : (
              <>No stores found{filters.search && ` matching "${filters.search}"`}</>
            )}
          </div>
        )}
      </div>

      {/* Store Grid */}
      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <>
          {stores.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No stores found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search ? (
                  <>
                    No stores match your search criteria. 
                    <button 
                      onClick={clearSearch}
                      className="text-blue-600 hover:text-blue-500 ml-1"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  'No stores are available at the moment.'
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div key={store.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{store.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={store.address}>
                      {store.address}
                    </p>
                    
                    {/* Overall Rating */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {renderStars(store.averageRating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {store.averageRating ? Number(store.averageRating).toFixed(1) : 'No ratings'}
                        </span>
                        {store.totalRatings > 0 && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({store.totalRatings} {store.totalRatings === 1 ? 'rating' : 'ratings'})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* User's Rating */}
                    {store.userRating && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700 font-medium">Your Rating:</span>
                          <div className="flex items-center">
                            <div className="flex mr-1">
                              {renderStars(store.userRating, 'w-3 h-3')}
                            </div>
                            <span className="text-sm text-blue-700 font-medium">{store.userRating}/5</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleRateStore(store)}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    {store.userRating ? 'Update Rating' : 'Rate Store'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex items-center space-x-2" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let page;
                  if (pagination.totalPages <= 5) {
                    page = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    page = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    page = pagination.totalPages - 4 + i;
                  } else {
                    page = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                                            key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === pagination.currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedStore && (
        <RatingModal
          store={selectedStore}
          currentRating={selectedStore.userRating}
          onSubmit={handleSubmitRating}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default StoreList;

