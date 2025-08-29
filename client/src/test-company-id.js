// Test script for company ID utility functions
import { getCompanyId, setCompanyId, removeCompanyId, hasCompanyId, getValidCompanyId } from './utils/companyUtils';

console.log('Testing Company ID Utility Functions...\n');

// Test 1: Check initial state
console.log('1. Initial state:');
console.log('Has company ID:', hasCompanyId());
console.log('Company ID:', getCompanyId());
console.log('Valid company ID:', getValidCompanyId());

// Test 2: Set company ID
console.log('\n2. Setting company ID to 13...');
setCompanyId(13);
console.log('Has company ID:', hasCompanyId());
console.log('Company ID:', getCompanyId());
console.log('Valid company ID:', getValidCompanyId());

// Test 3: Test with invalid values
console.log('\n3. Testing with invalid values:');
console.log('Company ID with fallback 1:', getCompanyId(1));
console.log('Valid company ID with fallback 1:', getValidCompanyId(1));

// Test 4: Remove company ID
console.log('\n4. Removing company ID...');
removeCompanyId();
console.log('Has company ID:', hasCompanyId());
console.log('Company ID:', getCompanyId());
console.log('Valid company ID:', getValidCompanyId());

// Test 5: Test with different fallbacks
console.log('\n5. Testing with different fallbacks:');
console.log('Company ID with fallback 6:', getCompanyId(6));
console.log('Valid company ID with fallback 6:', getValidCompanyId(6));

console.log('\n🎉 Company ID utility tests completed!');
console.log('\n📋 Summary:');
console.log('- Company ID should be stored and retrieved correctly');
console.log('- Invalid values should be handled gracefully');
console.log('- Fallback values should work as expected');
console.log('- Remove function should clear the stored value');
