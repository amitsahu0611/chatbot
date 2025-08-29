const { Lead } = require('../../models');
const logger = require('../../utils/logger');

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         '127.0.0.1';
};

/**
 * Extract key fields from form data
 */
const extractKeyFields = (formData) => {
  const extracted = {
    name: null,
    email: null,
    phone: null,
    topic: null
  };

  // Common field name patterns
  const namePatterns = ['name', 'fullname', 'full_name', 'firstname', 'first_name', 'lastname', 'last_name'];
  const emailPatterns = ['email', 'e-mail', 'mail'];
  const phonePatterns = ['phone', 'telephone', 'mobile', 'cell', 'contact'];
  const topicPatterns = ['topic', 'subject', 'interest', 'message', 'description', 'comment'];

  // Search for fields by common patterns
  Object.keys(formData).forEach(key => {
    const lowerKey = key.toLowerCase();
    
    // Name extraction
    if (namePatterns.some(pattern => lowerKey.includes(pattern))) {
      if (!extracted.name) {
        extracted.name = formData[key];
      }
    }
    
    // Email extraction
    if (emailPatterns.some(pattern => lowerKey.includes(pattern))) {
      if (!extracted.email) {
        extracted.email = formData[key];
      }
    }
    
    // Phone extraction
    if (phonePatterns.some(pattern => lowerKey.includes(pattern))) {
      if (!extracted.phone) {
        extracted.phone = formData[key];
      }
    }

    // Topic extraction
    if (topicPatterns.some(pattern => lowerKey.includes(pattern))) {
      if (!extracted.topic) {
        extracted.topic = formData[key];
      }
    }
  });

  return extracted;
};

/**
 * Track form submission and create lead (public endpoint - no authentication required)
 */
const trackFormSubmission = async (req, res) => {
  try {
    const { 
      companyId, 
      formData, 
      formType = 'custom', 
      source = 'Website Form',
      sessionId,
      timeToComplete,
      pageUrl 
    } = req.body;
    
    const clientIP = getClientIP(req);

    if (!companyId || !formData) {
      return res.status(400).json({
        success: false,
        message: 'Company ID and form data are required'
      });
    }

    logger.info(`📝 Form tracking for company ${companyId}, source: ${source}`);

    // Extract key fields from form data
    const extractedFields = extractKeyFields(formData);

    // Check if we have at least name or email
    if (!extractedFields.name && !extractedFields.email) {
      return res.status(400).json({
        success: false,
        message: 'Form must contain at least a name or email field'
      });
    }

    // Generate visitor ID from IP and timestamp
    const visitorId = `${clientIP}_${Date.now()}`;

    // Check if lead already exists by email
    let lead = null;
    if (extractedFields.email) {
      lead = await Lead.findOne({
        where: {
          email: extractedFields.email,
          companyId: parseInt(companyId)
        }
      });
    }

    if (lead) {
      // Update existing lead
      logger.info(`📝 Updating existing lead ID: ${lead.id} from form submission`);
      
      const updateData = {
        lastVisit: new Date(),
        visitCount: lead.visitCount + 1,
        formsSubmitted: lead.formsSubmitted + 1,
        lastActivity: new Date()
      };
      
      // Update name if not already set
      if (!lead.name && extractedFields.name) {
        updateData.name = extractedFields.name;
      }
      
      // Update phone if not already set
      if (!lead.phone && extractedFields.phone) {
        updateData.phone = extractedFields.phone;
      }
      
      // Update notes with form submission info
      const formInfo = `Form submitted: ${source} (${new Date().toLocaleDateString()})`;
      updateData.notes = lead.notes ? `${lead.notes}\n${formInfo}` : formInfo;
      
      await lead.update(updateData);
      
      logger.info(`✅ Lead updated successfully: ${lead.id}`);
    } else {
      // Create new lead
      logger.info(`📝 Creating new lead from form submission: ${source}`);
      
      const leadData = {
        companyId: parseInt(companyId),
        visitorId: visitorId,
        name: extractedFields.name,
        email: extractedFields.email,
        phone: extractedFields.phone,
        source: source,
        status: 'new',
        priority: 'medium',
        ipAddress: clientIP,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer,
        firstVisit: new Date(),
        lastVisit: new Date(),
        visitCount: 1,
        formsSubmitted: 1,
        lastActivity: new Date(),
        notes: extractedFields.topic ? `Interested in: ${extractedFields.topic}` : `Contact via ${source}`,
        customFields: {
          formType: formType,
          formData: formData,
          topic: extractedFields.topic || '',
          sessionId: sessionId,
          timeToComplete: timeToComplete,
          pageUrl: pageUrl
        },
        metadata: {
          source: source.toLowerCase().replace(/\s+/g, '_'),
          formType: formType,
          topic: extractedFields.topic,
          userAgent: req.headers['user-agent'],
          referrer: req.headers.referer,
          sessionId: sessionId,
          timeToComplete: timeToComplete,
          pageUrl: pageUrl
        }
      };
      
      lead = await Lead.create(leadData);
      logger.info(`✅ Lead created successfully with ID: ${lead.id}`);
    }

    res.status(201).json({
      success: true,
      message: 'Form tracked and lead processed successfully',
      data: {
        leadId: lead.id,
        visitorId: lead.visitorId,
        isNewLead: !lead.updatedAt || lead.updatedAt.getTime() === lead.createdAt.getTime(),
        extractedFields: extractedFields
      }
    });

  } catch (error) {
    logger.error('Form tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing form submission'
    });
  }
};

module.exports = {
  trackFormSubmission
};
