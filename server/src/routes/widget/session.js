const express = require('express');
const router = express.Router();
const VisitorSession = require('../../models/widget/VisitorSession');

// Ensure table exists
let tableEnsured = false;
const ensureTable = async () => {
  if (!tableEnsured) {
    try {
      await VisitorSession.sync();
      tableEnsured = true;
      console.log('✅ VisitorSession table ensured');
    } catch (error) {
      console.error('❌ Error ensuring VisitorSession table:', error.message);
    }
  }
};

/**
 * @swagger
 * /api/widget/session/check:
 *   post:
 *     summary: Check if visitor has an active session
 *     description: Checks if the visitor's IP has an active session for the company
 *     tags: [Widget Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *                 description: Company ID
 *               sessionDurationMinutes:
 *                 type: number
 *                 description: Session duration in minutes (default 120)
 *     responses:
 *       200:
 *         description: Session check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasActiveSession:
 *                       type: boolean
 *                     sessionToken:
 *                       type: string
 *                     visitorInfo:
 *                       type: object
 *                     expiresAt:
 *                       type: string
 */
const checkSession = async (req, res) => {
  try {
    // Set CORS headers for widget endpoints
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    const { companyId, sessionDurationMinutes = 120 } = req.body;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Get visitor IP address with better handling
    const ipAddress = req.ip || 
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress ||
                     (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
                     '127.0.0.1';

    console.log('🔍 Checking session for IP:', ipAddress, 'Company:', companyId);

    // Ensure table exists first with better error handling
    try {
      await ensureTable();
    } catch (tableError) {
      console.error('❌ Table creation error:', tableError.message);
      // Continue anyway - table might already exist
    }

    // Clean up expired sessions with error handling
    try {
      await VisitorSession.cleanupExpiredSessions();
      console.log('✅ Cleaned up expired sessions');
    } catch (cleanupError) {
      console.error('⚠️ Session cleanup error:', cleanupError.message);
      // Continue anyway - this is not critical
    }

    // Debug: Check all sessions for this company
    try {
      const allSessions = await VisitorSession.findAll({
        where: {
          companyId,
          isActive: true
        },
        order: [['lastActivity', 'DESC']],
        limit: 5
      });
      
      console.log('📊 Debug - All active sessions for company', companyId, ':');
      allSessions.forEach((s, i) => {
        console.log(`  ${i + 1}. IP: ${s.ipAddress}, Token: ${s.sessionToken.substring(0, 8)}..., Name: ${s.visitorName}, Email: ${s.visitorEmail}, Expires: ${s.expiresAt}`);
      });
    } catch (debugError) {
      console.error('⚠️ Debug query error:', debugError.message);
    }

    // Check for existing active session
    let session = null;
    try {
      session = await VisitorSession.findActiveSession(ipAddress, companyId);
      console.log('🔍 Found existing session:', session ? 'YES' : 'NO');
      if (session) {
        console.log('📋 Session details:', {
          token: session.sessionToken.substring(0, 8) + '...',
          name: session.visitorName,
          email: session.visitorEmail,
          expires: session.expiresAt,
          lastActivity: session.lastActivity
        });
      }
      
      // Also try raw SQL query for debugging
      if (!session) {
        console.log('🔍 Trying raw SQL query to debug...');
        const { sequelize } = require('../../config/database');
        const [rawResults] = await sequelize.query(`
          SELECT * FROM visitor_sessions 
          WHERE ip_address = :ipAddress 
          AND company_id = :companyId 
          AND is_active = 1 
          AND expires_at > NOW()
          ORDER BY last_activity DESC
          LIMIT 1
        `, {
          replacements: { ipAddress, companyId: parseInt(companyId) }
        });
        
        console.log('🔍 Raw SQL results:', rawResults.length > 0 ? 'FOUND' : 'NOT FOUND');
        if (rawResults.length > 0) {
          const rawSession = rawResults[0];
          console.log('📋 Raw session data:', {
            id: rawSession.id,
            ip_address: rawSession.ip_address,
            company_id: rawSession.company_id,
            session_token: rawSession.session_token.substring(0, 8) + '...',
            visitor_name: rawSession.visitor_name,
            visitor_email: rawSession.visitor_email,
            expires_at: rawSession.expires_at,
            is_active: rawSession.is_active
          });
        }
      }
    } catch (findError) {
      console.error('⚠️ Error finding session:', findError.message);
      // Continue to create new session
    }
    
    if (session) {
      // Update last activity
      try {
        session.lastActivity = new Date();
        await session.save();
        console.log('✅ Updated existing session activity');
      } catch (updateError) {
        console.error('⚠️ Error updating session:', updateError.message);
        // Continue anyway - session still exists
      }
      
      return res.json({
        success: true,
        data: {
          hasActiveSession: true,
          sessionToken: session.sessionToken,
          visitorInfo: {
            name: session.visitorName,
            email: session.visitorEmail,
            phone: session.visitorPhone,
            topic: session.topic
          },
          expiresAt: session.expiresAt,
          messageCount: session.messageCount,
          firstVisit: session.firstVisit,
          lastActivity: session.lastActivity
        }
      });
    } else {
      // Create new session
      try {
        session = await VisitorSession.createSession(ipAddress, companyId, sessionDurationMinutes);
        console.log('✅ Created new session:', session.sessionToken);
        
        return res.json({
          success: true,
          data: {
            hasActiveSession: false,
            sessionToken: session.sessionToken,
            expiresAt: session.expiresAt,
            isNewVisitor: true
          }
        });
      } catch (createError) {
        console.error('❌ Error creating session:', createError);
        
        // Fallback: return a temporary session
        const tempToken = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempExpiration = new Date(Date.now() + (sessionDurationMinutes * 60 * 1000));
        
        return res.json({
          success: true,
          data: {
            hasActiveSession: false,
            sessionToken: tempToken,
            expiresAt: tempExpiration,
            isNewVisitor: true,
            isTemporary: true
          }
        });
      }
    }
  } catch (error) {
    console.error('❌ Critical error in session check:', error);
    
    // Even if everything fails, provide a temporary session so the widget works
    const { companyId, sessionDurationMinutes = 120 } = req.body || {};
    const tempToken = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tempExpiration = new Date(Date.now() + (sessionDurationMinutes * 60 * 1000));
    
    res.json({
      success: true,
      data: {
        hasActiveSession: false,
        sessionToken: tempToken,
        expiresAt: tempExpiration,
        isNewVisitor: true,
        isTemporary: true,
        fallback: true
      }
    });
  }
};

/**
 * @swagger
 * /api/widget/session/register:
 *   post:
 *     summary: Register visitor information
 *     description: Save visitor information for an active session
 *     tags: [Widget Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionToken:
 *                 type: string
 *                 description: Session token
 *               visitorName:
 *                 type: string
 *                 description: Visitor's name
 *               visitorEmail:
 *                 type: string
 *                 description: Visitor's email
 *               visitorPhone:
 *                 type: string
 *                 description: Visitor's phone
 *               topic:
 *                 type: string
 *                 description: Topic of interest
 *               companyId:
 *                 type: string
 *                 description: Company ID
 *     responses:
 *       200:
 *         description: Visitor information saved
 */
const registerVisitor = async (req, res) => {
  try {
    // Set CORS headers for widget endpoints
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Ensure table exists first
    await ensureTable();
    
    const { 
      sessionToken, 
      visitorName, 
      visitorEmail, 
      visitorPhone, 
      topic,
      companyId 
    } = req.body;

    console.log('📝 Registration request body:', req.body);

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'Session token is required. Please ensure you have an active session before registering.'
      });
    }

    // Find the session
    console.log('🔍 Looking for session with token:', sessionToken.substring(0, 8) + '...');
    const session = await VisitorSession.findOne({
      where: { 
        sessionToken, 
        isActive: true 
      }
    });

    console.log('📋 Found session for registration:', session ? 'YES' : 'NO');
    if (session) {
      console.log('📋 Session details before update:', {
        id: session.id,
        ipAddress: session.ipAddress,
        companyId: session.companyId,
        token: session.sessionToken.substring(0, 8) + '...',
        expires: session.expiresAt,
        isActive: session.isActive
      });
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
    }

    // Update session with visitor information
    session.visitorName = visitorName;
    session.visitorEmail = visitorEmail;
    session.visitorPhone = visitorPhone;
    session.topic = topic;
    session.lastActivity = new Date();
    
    // Extract user agent and other metadata
    session.userAgent = req.headers['user-agent'] || '';
    session.metadata = {
      ...session.metadata,
      registeredAt: new Date(),
      referer: req.headers.referer || '',
      acceptLanguage: req.headers['accept-language'] || ''
    };

    await session.save();
    
    console.log('✅ Session updated successfully:', {
      id: session.id,
      ipAddress: session.ipAddress,
      companyId: session.companyId,
      token: session.sessionToken.substring(0, 8) + '...',
      name: session.visitorName,
      email: session.visitorEmail,
      expires: session.expiresAt,
      isActive: session.isActive
    });

    // Create lead if email is provided
    if (visitorEmail && !session.leadCreated) {
      try {
        const Lead = require('../../models/company-admin/lead-viewer/Lead');
        
        // Generate a unique visitor ID from session token or create one
        const visitorId = sessionToken || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('🔍 Debug Lead Creation:', {
          sessionToken: sessionToken,
          visitorId: visitorId,
          visitorEmail: visitorEmail,
          companyId: companyId
        });
        
        // Ensure visitorId is never null or undefined
        const finalVisitorId = visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Validate companyId
        const parsedCompanyId = parseInt(companyId);
        if (!parsedCompanyId || isNaN(parsedCompanyId)) {
          console.error('❌ Invalid companyId:', companyId);
          throw new Error('Invalid companyId provided');
        }
        
        const leadData = {
          visitorId: finalVisitorId,
          name: visitorName || 'Anonymous Visitor',
          email: visitorEmail,
          phone: visitorPhone || null,
          companyId: parsedCompanyId,
          source: 'Chat Widget',
          status: 'new',
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          sessionId: sessionToken,
          firstVisit: session.firstVisit || new Date(),
          lastVisit: new Date(),
          lastActivity: new Date(),
          // Store additional information in metadata
          metadata: {
            topic: topic,
            sessionToken: sessionToken,
            registrationSource: 'chat_widget',
            registeredAt: new Date()
          }
        };

        console.log('🔄 Attempting to create lead with data:', JSON.stringify(leadData, null, 2));
        
        const lead = await Lead.create(leadData);
        
        session.leadCreated = true;
        // session.leadId = lead.id; // Store lead ID in session for reference (commented out until column exists)
        await session.save();
        
        console.log('✅ Lead created from chat widget registration:', {
          leadId: lead.id,
          visitorId: finalVisitorId,
          email: visitorEmail,
          name: visitorName
        });
      } catch (leadError) {
        console.error('❌ Failed to create lead:', leadError);
        console.error('Lead error details:', leadError.message);
        // Don't fail the request if lead creation fails
      }
    }

    res.json({
      success: true,
      data: {
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        visitorInfo: {
          name: session.visitorName,
          email: session.visitorEmail,
          phone: session.visitorPhone,
          topic: session.topic
        }
      }
    });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register visitor information'
    });
  }
};

/**
 * @swagger
 * /api/widget/session/activity:
 *   post:
 *     summary: Update session activity
 *     description: Update the last activity time for a session
 *     tags: [Widget Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionToken:
 *                 type: string
 *                 description: Session token
 *     responses:
 *       200:
 *         description: Activity updated
 */
const updateActivity = async (req, res) => {
  try {
    // Set CORS headers for widget endpoints
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'Session token is required'
      });
    }

    const session = await VisitorSession.updateActivity(sessionToken);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
    }

    res.json({
      success: true,
      data: {
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity'
    });
  }
};

/**
 * @swagger
 * /api/widget/session/cleanup:
 *   post:
 *     summary: Cleanup expired sessions
 *     description: Remove expired sessions (admin endpoint)
 *     tags: [Widget Session]
 *     responses:
 *       200:
 *         description: Cleanup completed
 */
const cleanupSessions = async (req, res) => {
  try {
    const cleanedCount = await VisitorSession.cleanupExpiredSessions();
    
    res.json({
      success: true,
      data: {
        cleanedSessions: cleanedCount[0] || 0
      }
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup sessions'
    });
  }
};

// Handle preflight OPTIONS requests
router.options('/check', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

router.options('/register', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

router.options('/activity', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Routes
router.post('/check', checkSession);
router.post('/register', registerVisitor);
router.post('/activity', updateActivity);
router.post('/cleanup', cleanupSessions);

module.exports = router;
