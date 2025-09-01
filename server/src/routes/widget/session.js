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
    // Ensure table exists first
    await ensureTable();
    
    const { companyId, sessionDurationMinutes = 120 } = req.body;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Get visitor IP address
    const ipAddress = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     '127.0.0.1';

    console.log('Checking session for IP:', ipAddress, 'Company:', companyId);

    // Clean up expired sessions first
    await VisitorSession.cleanupExpiredSessions();

    // Check for existing active session
    let session = await VisitorSession.findActiveSession(ipAddress, companyId);
    
    if (session) {
      // Update last activity
      session.lastActivity = new Date();
      await session.save();
      
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
      session = await VisitorSession.createSession(ipAddress, companyId, sessionDurationMinutes);
      
      return res.json({
        success: true,
        data: {
          hasActiveSession: false,
          sessionToken: session.sessionToken,
          expiresAt: session.expiresAt,
          isNewVisitor: true
        }
      });
    }
  } catch (error) {
    console.error('Error checking session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check session'
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

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'Session token is required'
      });
    }

    // Find the session
    const session = await VisitorSession.findOne({
      where: { 
        sessionToken, 
        isActive: true 
      }
    });

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

    // Create lead if email is provided
    if (visitorEmail && !session.leadCreated) {
      try {
        const Lead = require('../../models/company-admin/lead-viewer/Lead');
        
        await Lead.create({
          name: visitorName || 'Anonymous Visitor',
          email: visitorEmail,
          phone: visitorPhone || '',
          companyId: companyId,
          source: 'Chat Widget',
          status: 'new',
          formData: {
            topic: topic,
            sessionToken: sessionToken,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent
          },
          formType: 'chat_widget_registration',
          submittedAt: new Date()
        });
        
        session.leadCreated = true;
        await session.save();
        
        console.log('✅ Lead created from chat widget registration');
      } catch (leadError) {
        console.error('❌ Failed to create lead:', leadError);
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

// Routes
router.post('/check', checkSession);
router.post('/register', registerVisitor);
router.post('/activity', updateActivity);
router.post('/cleanup', cleanupSessions);

module.exports = router;
