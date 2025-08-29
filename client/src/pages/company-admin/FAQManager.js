import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  EyeIcon,
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UnansweredQueries from '../../components/company-admin/faq-manager/UnansweredQueries';

const FAQManager = () => {
  const { getCurrentCompanyId } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedFAQs, setSelectedFAQs] = useState([]);
  const [showUnansweredQueries, setShowUnansweredQueries] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    isActive: '',
    sortBy: 'order',
    sortOrder: 'asc'
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalFAQs: 0,
    limit: 10
  });

  // FAQ form state
  const [faqData, setFaqData] = useState({
    question: '',
    answer: '',
    category: '',
    tags: [],
    searchKeywords: [],
    order: 0,
    isActive: true
  });

  const defaultCategories = ['Account', 'General', 'Support', 'Billing', 'Technical'];

  useEffect(() => {
    fetchFAQs();
    fetchStats();
    fetchCategories();
  }, [filters, pagination.currentPage]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const companyId = getCurrentCompanyId();
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      });

      // Add companyId for super admin context
      if (companyId) {
        params.append('companyId', companyId);
      }

      const response = await api.get(`/company-admin/faq-manager?${params}`);
      console.log('FAQs response:', response.data);
      if (response.data.success && Array.isArray(response.data.data?.faqs)) {
        setFaqs(response.data.data.faqs);
        setPagination(prev => ({
          ...prev,
          ...(response.data.data?.pagination || {})
        }));
      } else {
        console.warn('Unexpected FAQs response structure:', response.data);
        setFaqs([]);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      alert('Error loading FAQs. Please refresh the page.');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const companyId = getCurrentCompanyId();
      const params = companyId ? `?companyId=${companyId}` : '';
      const response = await api.get(`/company-admin/faq-manager/stats${params}`);
      console.log('Stats response:', response.data);
      if (response.data.success && response.data.data) {
        setStats(response.data.data);
      } else {
        console.warn('Unexpected stats response structure:', response.data);
        setStats({});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't show alert for stats as it's not critical
      setStats({});
    }
  };

  const fetchCategories = async () => {
    try {
      const companyId = getCurrentCompanyId();
      const params = companyId ? `?companyId=${companyId}` : '';
      const response = await api.get(`/company-admin/faq-manager/categories${params}`);
      console.log('Categories response:', response.data);
      if (response.data.success && Array.isArray(response.data.data)) {
        setCategories(response.data.data);
      } else {
        console.warn('Unexpected categories response structure:', response.data);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Don't show alert for categories as it's not critical
      setCategories([]);
    }
  };

  const handleCreateFAQ = () => {
    setFaqData({
      question: '',
      answer: '',
      category: '',
      tags: [],
      searchKeywords: [],
      order: 0,
      isActive: true
    });
    setIsCreating(true);
    setIsEditing(false);
    setSelectedFAQ(null);
  };

     const handleEditFAQ = (faq) => {
     setFaqData({
       question: faq.question,
       answer: faq.answer,
       category: faq.category,
       tags: Array.isArray(faq.tags) ? faq.tags : [],
       searchKeywords: Array.isArray(faq.searchKeywords) ? faq.searchKeywords : [],
       order: faq.order || 0,
       isActive: faq.isActive
     });
     setSelectedFAQ(faq);
     setIsEditing(true);
     setIsCreating(false);
   };

  const handleSaveFAQ = async () => {
    // Validate required fields
    if (!faqData.question.trim()) {
      alert('Please enter a question.');
      return;
    }
    if (!faqData.answer.trim()) {
      alert('Please enter an answer.');
      return;
    }
    if (!faqData.category.trim()) {
      alert('Please select a category.');
      return;
    }

    try {
      const companyId = getCurrentCompanyId();
      const params = companyId ? `?companyId=${companyId}` : '';
      
      if (isEditing) {
        await api.put(`/company-admin/faq-manager/${selectedFAQ.id}${params}`, faqData);
      } else {
        await api.post(`/company-admin/faq-manager${params}`, faqData);
      }
      
      setIsCreating(false);
      setIsEditing(false);
      setSelectedFAQ(null);
      fetchFAQs();
      fetchStats();
      fetchCategories();
      alert(isEditing ? 'FAQ updated successfully!' : 'FAQ created successfully!');
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Error saving FAQ. Please try again.');
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        const companyId = getCurrentCompanyId();
        const params = companyId ? `?companyId=${companyId}` : '';
        await api.delete(`/company-admin/faq-manager/${faqId}${params}`);
        fetchFAQs();
        fetchStats();
        fetchCategories();
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        alert('Error deleting FAQ. Please try again.');
      }
    }
  };

  const handleBulkUpdate = async (updates) => {
    if (selectedFAQs.length === 0) return;

    try {
      const companyId = getCurrentCompanyId();
      const params = companyId ? `?companyId=${companyId}` : '';
      await api.put(`/company-admin/faq-manager/bulk-update${params}`, {
        faqIds: selectedFAQs,
        updates
      });
      setSelectedFAQs([]);
      fetchFAQs();
      fetchStats();
      alert('FAQs updated successfully!');
    } catch (error) {
      console.error('Error bulk updating FAQs:', error);
      alert('Error updating FAQs. Please try again.');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSelectFAQ = (faqId) => {
    setSelectedFAQs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

     const handleSelectAll = () => {
     if (!Array.isArray(faqs)) return;
     if (selectedFAQs.length === faqs.length) {
       setSelectedFAQs([]);
     } else {
       setSelectedFAQs(faqs.map(faq => faq.id));
     }
   };

     const addTag = () => {
     const newTag = window.prompt('Enter a new tag:');
     if (newTag && Array.isArray(faqData.tags) && !faqData.tags.includes(newTag)) {
       setFaqData(prev => ({
         ...prev,
         tags: [...(Array.isArray(prev.tags) ? prev.tags : []), newTag]
       }));
     }
   };

     const removeTag = (tagToRemove) => {
     setFaqData(prev => ({
       ...prev,
       tags: Array.isArray(prev.tags) ? prev.tags.filter(tag => tag !== tagToRemove) : []
     }));
   };

     const addKeyword = () => {
     const newKeyword = window.prompt('Enter a new search keyword:');
     if (newKeyword && Array.isArray(faqData.searchKeywords) && !faqData.searchKeywords.includes(newKeyword)) {
       setFaqData(prev => ({
         ...prev,
         searchKeywords: [...(Array.isArray(prev.searchKeywords) ? prev.searchKeywords : []), newKeyword]
       }));
     }
   };

     const removeKeyword = (keywordToRemove) => {
     setFaqData(prev => ({
       ...prev,
       searchKeywords: Array.isArray(prev.searchKeywords) ? prev.searchKeywords.filter(keyword => keyword !== keywordToRemove) : []
     }));
   };

  if (isCreating || isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit FAQ' : 'Create New FAQ'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update FAQ information' : 'Add a new FAQ to your knowledge base'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
                setSelectedFAQ(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFAQ}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save FAQ
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <textarea
                  value={faqData.question}
                  onChange={(e) => setFaqData({ ...faqData, question: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the question..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                <textarea
                  value={faqData.answer}
                  onChange={(e) => setFaqData({ ...faqData, answer: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the answer..."
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={faqData.category}
                  onChange={(e) => setFaqData({ ...faqData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {defaultCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input
                  type="number"
                  value={faqData.order}
                  onChange={(e) => setFaqData({ ...faqData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={faqData.isActive}
                  onChange={(e) => setFaqData({ ...faqData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                                     {Array.isArray(faqData.tags) ? faqData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )) : null}
                </div>
                <button
                  onClick={addTag}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Tag
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Keywords</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                                     {Array.isArray(faqData.searchKeywords) ? faqData.searchKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )) : null}
                </div>
                <button
                  onClick={addKeyword}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  + Add Keyword
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Manager</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage FAQ articles for your chatbot
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              console.log('🔘 Unanswered Queries button clicked');
              setShowUnansweredQueries(true);
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            Unanswered Queries
          </button>
          <button
            onClick={handleCreateFAQ}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add FAQ
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total FAQs</p>
              <p className="text-lg font-semibold text-gray-900">{stats.overview?.total || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-green-600">A</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-lg font-semibold text-gray-900">{stats.overview?.active || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">V</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Views</p>
              <p className="text-lg font-semibold text-gray-900">{stats.overview?.totalViews || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-yellow-600">H</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Helpful Votes</p>
              <p className="text-lg font-semibold text-gray-900">{stats.overview?.totalHelpful || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
                         {Array.isArray(categories) ? categories.map(category => (
               <option key={category.name} value={category.name}>
                 {category.name} ({category.count})
               </option>
             )) : null}
          </select>
          <select
            value={filters.isActive}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="order">Order</option>
            <option value="createdAt">Created Date</option>
            <option value="views">Views</option>
            <option value="helpfulCount">Helpful Votes</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedFAQs.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedFAQs.length} FAQ(s) selected
            </span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleBulkUpdate({ isActive: true })}
                className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkUpdate({ isActive: false })}
                className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
              >
                Deactivate
              </button>
              <button
                onClick={() => {
                  const newCategory = window.prompt('Enter new category:');
                  if (newCategory) {
                    handleBulkUpdate({ category: newCategory });
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Change Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading FAQs...</p>
          </div>
        ) : !Array.isArray(faqs) || faqs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No FAQs found. Create your first FAQ to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={Array.isArray(faqs) && selectedFAQs.length === faqs.length && faqs.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FAQ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Helpful
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                                 {Array.isArray(faqs) ? faqs.map((faq) => (
                   <tr key={faq.id} className="hover:bg-gray-50">
                                         <td className="px-6 py-4">
                       <input
                         type="checkbox"
                         checked={selectedFAQs.includes(faq.id)}
                         onChange={() => handleSelectFAQ(faq.id)}
                         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                       />
                     </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{faq.question}</div>
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">{faq.answer}</div>
                                                                          {faq.tags && Array.isArray(faq.tags) && faq.tags.length > 0 && (
                           <div className="flex flex-wrap gap-1 mt-2">
                             {faq.tags.slice(0, 3).map((tag, index) => (
                               <span
                                 key={index}
                                 className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                               >
                                 {tag}
                               </span>
                             ))}
                             {faq.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{faq.tags.length - 3} more</span>
                              )}
                           </div>
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{faq.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        faq.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {faq.views || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {faq.helpfulCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {faq.order || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditFAQ(faq)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                                                 <button
                           onClick={() => handleDeleteFAQ(faq.id)}
                           className="text-red-600 hover:text-red-900"
                           title="Delete"
                         >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalFAQs)} of{' '}
            {pagination.totalFAQs} FAQs
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
              disabled={pagination.currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(pagination.totalPages, prev.currentPage + 1) }))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Unanswered Queries Modal */}
      <UnansweredQueries 
        isOpen={showUnansweredQueries} 
        onClose={() => setShowUnansweredQueries(false)}
      />
    </div>
  );
};

export default FAQManager;
