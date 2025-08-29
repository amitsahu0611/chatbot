import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';

const UnansweredQueries = ({ isOpen, onClose }) => {
  const { user, getCurrentCompanyId } = useAuth();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('frequency');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const companyId = getCurrentCompanyId();
    console.log('🔄 useEffect triggered:', { 
      isOpen, 
      companyId,
      userCompanyId: user?.companyId, 
      shouldFetch: isOpen && companyId 
    });
    if (isOpen && companyId) {
      fetchQueries();
    }
  }, [isOpen, getCurrentCompanyId, currentPage, sortBy, sortOrder, statusFilter]);

  const fetchQueries = async () => {
    const companyId = getCurrentCompanyId();
    console.log('🔍 Fetching unanswered queries...', { 
      companyId, 
      isOpen, 
      currentPage, 
      statusFilter 
    });
    setLoading(true);
    try {
      const params = new URLSearchParams({
        companyId: companyId,
        page: currentPage,
        limit: 10,
        status: statusFilter,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (searchTerm.trim()) {
        const response = await fetch(`${API_URL}/api/company-admin/unanswered-queries/search?${params}&searchTerm=${encodeURIComponent(searchTerm)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setQueries(data.data.queries);
          setTotalPages(data.data.pagination.totalPages);
        }
      } else {
        console.log('📡 Making API call to:', `${API_URL}/api/company-admin/unanswered-queries?${params}`);
        const response = await fetch(`${API_URL}/api/company-admin/unanswered-queries?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('📡 API Response status:', response.status);
        const data = await response.json();
        console.log('📡 API Response data:', data);
        if (data.success) {
          setQueries(data.data.queries);
          setStats(data.data.stats);
          setTotalPages(data.data.pagination.totalPages);
          console.log('✅ Queries set:', data.data.queries.length);
        } else {
          console.error('❌ API Error:', data);
        }
      }
    } catch (error) {
      console.error('Error fetching unanswered queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQueryStatus = async (queryId, status, notes = '', autoCreateFaq = false, faqAnswer = '', faqCategory = 'General') => {
    try {
      const response = await fetch(`${API_URL}/api/company-admin/unanswered-queries/${queryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          status, 
          notes, 
          autoCreateFaq, 
          faqAnswer, 
          faqCategory 
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchQueries();
        setShowDetails(false);
        
        // Show success message
        if (data.data.autoCreatedFaq) {
          alert('Query marked as answered and FAQ created successfully!');
        }
      }
    } catch (error) {
      console.error('Error updating query status:', error);
    }
  };

  const getPriorityColor = (priority, frequency) => {
    if (frequency >= 10) return 'text-red-600 bg-red-100';
    if (frequency >= 5) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'answered': return 'text-green-600 bg-green-100';
      case 'ignored': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Unanswered Queries</h2>
                <p className="text-blue-100 text-sm">Questions your AI couldn't answer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats.totalQuestions > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.answered || 0}</div>
                <div className="text-sm text-gray-600">Answered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.ignored || 0}</div>
                <div className="text-sm text-gray-600">Ignored</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalFrequency || 0}</div>
                <div className="text-sm text-gray-600">Total Asks</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="px-6 py-4 border-b bg-white space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="answered">Answered</option>
              <option value="ignored">Ignored</option>
              <option value="all">All Status</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="frequency">Most Asked</option>
              <option value="lastAsked">Recently Asked</option>
              <option value="createdAt">Date Added</option>
              <option value="priority">Priority</option>
            </select>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchQueries()}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={fetchQueries}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Queries List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : queries.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No unanswered queries</h3>
              <p className="mt-1 text-sm text-gray-500">
                {statusFilter === 'pending' 
                  ? "Great! Your AI is answering all questions well."
                  : `No ${statusFilter} queries found.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {queries.map((query) => (
                <div key={query.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(query.priority, query.frequency)}`}>
                          <FireIcon className="h-3 w-3 mr-1" />
                          Asked {query.frequency}x
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                          {query.status}
                        </span>
                        <span className="flex items-center text-xs text-gray-500">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {new Date(query.lastAsked).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        "{query.query}"
                      </h4>
                      
                      {query.relatedFaq && (
                        <div className="text-sm text-green-600 bg-green-50 rounded-lg p-2 mb-2">
                          <strong>Linked to FAQ:</strong> {query.relatedFaq.question}
                        </div>
                      )}
                      
                      {query.notes && (
                        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <strong>Notes:</strong> {query.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {query.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedQuery({...query, faqAnswer: '', faqCategory: 'General'});
                              setShowDetails(true);
                            }}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-medium"
                            title="Answer & Create FAQ"
                          >
                            Answer
                          </button>
                          <button
                            onClick={() => updateQueryStatus(query.id, 'ignored')}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium"
                            title="Reject Query"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Query Details Modal */}
      {showDetails && selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-green-500 to-blue-500">
              <h3 className="text-lg font-medium text-white">Answer Query & Create FAQ</h3>
              <p className="text-green-100 text-sm">Convert this unanswered query into a helpful FAQ</p>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Query</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">{selectedQuery.query}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <div className="text-sm text-gray-600">{selectedQuery.frequency} times</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <div className="text-sm text-gray-600 capitalize">{selectedQuery.priority}</div>
                </div>
              </div>

              {/* FAQ Creation Section */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Create FAQ Answer</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={5}
                      placeholder="Provide a clear and helpful answer for this question..."
                      value={selectedQuery.faqAnswer || ''}
                      onChange={(e) => setSelectedQuery({...selectedQuery, faqAnswer: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be added as a new FAQ that your AI can use to answer similar questions.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={selectedQuery.faqCategory || 'General'}
                      onChange={(e) => setSelectedQuery({...selectedQuery, faqCategory: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="General">General</option>
                      <option value="Account">Account</option>
                      <option value="Billing">Billing</option>
                      <option value="Technical">Technical</option>
                      <option value="Support">Support</option>
                      <option value="Product">Product</option>
                      <option value="Service">Service</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add notes about this query..."
                  value={selectedQuery.notes || ''}
                  onChange={(e) => setSelectedQuery({...selectedQuery, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => updateQueryStatus(
                  selectedQuery.id, 
                  'answered', 
                  selectedQuery.notes, 
                  true, // Always auto-create FAQ
                  selectedQuery.faqAnswer, 
                  selectedQuery.faqCategory
                )}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedQuery.faqAnswer?.trim()}
              >
                Submit & Create FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnansweredQueries;
