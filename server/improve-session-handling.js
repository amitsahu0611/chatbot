/**
 * Instructions for improving session handling in the widget:
 * 
 * 1. Use localStorage to persist session data across page refreshes
 * 2. Store session token, user info, and expiration time locally
 * 3. Check local storage first before making API calls
 * 4. Implement graceful fallbacks when API calls fail
 * 
 * Add this JavaScript to your widget:
 */

const SessionManager = {
  // Storage keys
  SESSION_KEY: 'chatbot_session',
  USER_INFO_KEY: 'chatbot_user_info',
  
  // Save session to localStorage
  saveSession(sessionData) {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        sessionToken: sessionData.sessionToken,
        expiresAt: sessionData.expiresAt,
        companyId: sessionData.companyId,
        hasActiveSession: sessionData.hasActiveSession,
        savedAt: new Date().toISOString()
      }));
      console.log('✅ Session saved to localStorage');
    } catch (error) {
      console.error('⚠️ Failed to save session to localStorage:', error);
    }
  },
  
  // Save user info to localStorage
  saveUserInfo(userInfo) {
    try {
      localStorage.setItem(this.USER_INFO_KEY, JSON.stringify({
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        topic: userInfo.topic,
        savedAt: new Date().toISOString()
      }));
      console.log('✅ User info saved to localStorage');
    } catch (error) {
      console.error('⚠️ Failed to save user info to localStorage:', error);
    }
  },
  
  // Get session from localStorage
  getSession() {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData);
      
      // Check if session is expired
      if (new Date(session.expiresAt) <= new Date()) {
        console.log('⚠️ Local session expired');
        this.clearSession();
        return null;
      }
      
      console.log('✅ Found valid local session');
      return session;
    } catch (error) {
      console.error('⚠️ Failed to get session from localStorage:', error);
      return null;
    }
  },
  
  // Get user info from localStorage
  getUserInfo() {
    try {
      const userInfoData = localStorage.getItem(this.USER_INFO_KEY);
      if (!userInfoData) return null;
      
      const userInfo = JSON.parse(userInfoData);
      console.log('✅ Found local user info');
      return userInfo;
    } catch (error) {
      console.error('⚠️ Failed to get user info from localStorage:', error);
      return null;
    }
  },
  
  // Clear session data
  clearSession() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.USER_INFO_KEY);
      console.log('✅ Session cleared from localStorage');
    } catch (error) {
      console.error('⚠️ Failed to clear session from localStorage:', error);
    }
  },
  
  // Check if user has existing session and info
  hasCompleteSession() {
    const session = this.getSession();
    const userInfo = this.getUserInfo();
    
    return session && userInfo && userInfo.email;
  }
};

// Enhanced session check function for the widget
async function checkSessionWithFallback(companyId) {
  // First, check localStorage
  const localSession = SessionManager.getSession();
  const localUserInfo = SessionManager.getUserInfo();
  
  if (localSession && localUserInfo && localUserInfo.email) {
    console.log('✅ Using local session data');
    return {
      success: true,
      data: {
        hasActiveSession: true,
        sessionToken: localSession.sessionToken,
        visitorInfo: localUserInfo,
        expiresAt: localSession.expiresAt,
        isLocal: true
      }
    };
  }
  
  // If no local session, try API call
  try {
    const response = await fetch('/api/widget/session/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: companyId,
        sessionDurationMinutes: 120
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      // Save session data locally
      SessionManager.saveSession({
        sessionToken: result.data.sessionToken,
        expiresAt: result.data.expiresAt,
        companyId: companyId,
        hasActiveSession: result.data.hasActiveSession
      });
      
      // If we have visitor info, save it too
      if (result.data.visitorInfo && result.data.visitorInfo.email) {
        SessionManager.saveUserInfo(result.data.visitorInfo);
      }
    }
    
    return result;
  } catch (error) {
    console.error('⚠️ API session check failed:', error);
    
    // Return a fallback session
    const fallbackToken = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fallbackExpiration = new Date(Date.now() + (120 * 60 * 1000)).toISOString();
    
    const fallbackSession = {
      sessionToken: fallbackToken,
      expiresAt: fallbackExpiration,
      companyId: companyId,
      hasActiveSession: false
    };
    
    SessionManager.saveSession(fallbackSession);
    
    return {
      success: true,
      data: {
        hasActiveSession: false,
        sessionToken: fallbackToken,
        expiresAt: fallbackExpiration,
        isNewVisitor: true,
        isFallback: true
      }
    };
  }
}

console.log(`
🚀 Session Management Improvements:

1. Add the SessionManager and checkSessionWithFallback functions to your widget
2. Use checkSessionWithFallback() instead of direct API calls
3. Check SessionManager.hasCompleteSession() before showing registration form
4. Always save user data locally after successful registration

Example usage in widget:
// Check if user already has complete session
if (SessionManager.hasCompleteSession()) {
  // Skip registration form, go directly to chat
  showChatInterface();
} else {
  // Show registration form
  showRegistrationForm();
}
`);

module.exports = { SessionManager, checkSessionWithFallback };
