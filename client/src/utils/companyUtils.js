/**
 * Utility functions for handling company ID consistently across the application
 */

// Company utility functions

export const setCompanyId = (companyId) => {
  if (companyId) {
    localStorage.setItem('companyId', companyId.toString());
  }
};

export const getCompanyId = () => {
  return localStorage.getItem('companyId');
};

export const removeCompanyId = () => {
  localStorage.removeItem('companyId');
};

// Get current company ID (for super admin, use selected company)
export const getCurrentCompanyId = () => {
  const selectedCompanyId = localStorage.getItem('selectedCompanyId');
  if (selectedCompanyId) {
    return parseInt(selectedCompanyId);
  }
  
  const companyId = localStorage.getItem('companyId');
  return companyId ? parseInt(companyId) : null;
};

// Get current company name
export const getCurrentCompanyName = () => {
  return localStorage.getItem('selectedCompanyName') || 'Your Company';
};

/**
 * Check if a company ID is stored in localStorage
 * @returns {boolean} True if company ID exists
 */
export const hasCompanyId = () => {
  return localStorage.getItem('companyId') !== null;
};

/**
 * Get company ID with validation
 * @param {number} fallbackCompanyId - Fallback company ID if none is stored
 * @returns {number} The validated company ID
 */
export const getValidCompanyId = (fallbackCompanyId = 1) => {
  const companyId = getCompanyId(fallbackCompanyId);
  
  // Ensure it's a valid number
  if (isNaN(companyId) || companyId <= 0) {
    console.warn('Invalid company ID found, using fallback:', fallbackCompanyId);
    return fallbackCompanyId;
  }
  
  return companyId;
};
