const { Form, FormSubmission, Lead } = require('../../../models');
const { Op } = require('sequelize');
const logger = require('../../../utils/logger');

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
    phone: null
  };

  // Common field name patterns
  const namePatterns = ['name', 'fullname', 'full_name', 'firstname', 'first_name', 'lastname', 'last_name'];
  const emailPatterns = ['email', 'e-mail', 'mail'];
  const phonePatterns = ['phone', 'telephone', 'mobile', 'cell', 'contact'];

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
  });

  return extracted;
};

/**
 * Calculate spam score for form submission
 */
const calculateSpamScore = (formData, req) => {
  let score = 0;
  
  // Check for suspicious patterns
  const suspiciousWords = ['viagra', 'casino', 'loan', 'credit', 'free', 'money', 'winner'];
  const formString = JSON.stringify(formData).toLowerCase();
  
  suspiciousWords.forEach(word => {
    if (formString.includes(word)) {
      score += 0.1;
    }
  });
  
  // Check for too many fields (potential spam)
  if (Object.keys(formData).length > 20) {
    score += 0.2;
  }
  
  // Check for suspicious user agent
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('bot') || userAgent.includes('crawler')) {
    score += 0.3;
  }
  
  return Math.min(score, 1.0);
};

/**
 * Create or update lead from form submission
 */
const createOrUpdateLead = async (formData, extractedFields, form, req) => {
  try {
    const clientIP = getClientIP(req);
    const visitorId = `${clientIP}_${Date.now()}`;
    
    // Check if lead already exists by email
    let lead = null;
    if (extractedFields.email) {
      lead = await Lead.findOne({
        where: {
          email: extractedFields.email,
          companyId: form.companyId
        }
      });
    }
    
    if (lead) {
      // Update existing lead
      logger.info(`📝 Updating existing lead ID: ${lead.id} from form submission`);
      
      // Update lead information
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
      const formInfo = `Form submitted: ${form.name} (${new Date().toLocaleDateString()})`;
      updateData.notes = lead.notes ? `${lead.notes}\n${formInfo}` : formInfo;
      
      await lead.update(updateData);
      
      return lead;
    } else {
      // Create new lead
      logger.info(`📝 Creating new lead from form submission: ${form.name}`);
      
      const leadData = {
        companyId: form.companyId,
        visitorId: visitorId,
        name: extractedFields.name,
        email: extractedFields.email,
        phone: extractedFields.phone,
        source: form.settings?.leadGeneration?.leadSource || 'Website Form',
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
        notes: `Initial contact via form: ${form.name}`,
        customFields: {
          formName: form.name,
          formType: form.formType,
          formData: formData
        },
        metadata: {
          source: 'website_form',
          formId: form.id,
          formName: form.name,
          formType: form.formType,
          userAgent: req.headers['user-agent'],
          referrer: req.headers.referer
        }
      };
      
      lead = await Lead.create(leadData);
      logger.info(`✅ Lead created successfully with ID: ${lead.id}`);
      
      return lead;
    }
  } catch (error) {
    logger.error('Error creating/updating lead:', error);
    throw error;
  }
};

/**
 * Submit form data (public endpoint - no authentication required)
 */
const submitForm = async (req, res) => {
  try {
    const { formId, formData, sessionId, timeToComplete, pageUrl } = req.body;
    const clientIP = getClientIP(req);

    if (!formId || !formData) {
      return res.status(400).json({
        success: false,
        message: 'Form ID and form data are required'
      });
    }

    logger.info(`📝 Form submission received for form ID: ${formId}, IP: ${clientIP}`);

    // Find the form
    const form = await Form.findOne({
      where: {
        id: parseInt(formId),
        isActive: true,
        isPublished: true
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or not published'
      });
    }

    // Calculate spam score
    const spamScore = calculateSpamScore(formData, req);
    const isSpam = spamScore > 0.7;

    // Extract key fields for lead creation
    const extractedFields = extractKeyFields(formData);

    // Create form submission record
    const submissionData = {
      formId: form.id,
      companyId: form.companyId,
      formData: formData,
      name: extractedFields.name,
      email: extractedFields.email,
      phone: extractedFields.phone,
      visitorId: `${clientIP}_${Date.now()}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      sessionId: sessionId,
      status: isSpam ? 'spam' : 'submitted',
      spamScore: spamScore,
      timeToComplete: timeToComplete,
      pageUrl: pageUrl,
      // Extract UTM parameters from referrer or form data
      utmSource: formData.utm_source || null,
      utmMedium: formData.utm_medium || null,
      utmCampaign: formData.utm_campaign || null,
      utmTerm: formData.utm_term || null,
      utmContent: formData.utm_content || null
    };

    const submission = await FormSubmission.create(submissionData);
    logger.info(`✅ Form submission created with ID: ${submission.id}`);

    // Create or update lead if lead generation is enabled
    let lead = null;
    if (form.settings?.leadGeneration?.enabled && !isSpam) {
      try {
        lead = await createOrUpdateLead(formData, extractedFields, form, req);
        
        // Update submission with lead ID
        await submission.update({
          leadId: lead.id,
          leadCreated: true,
          leadCreatedAt: new Date(),
          status: 'processed'
        });
        
        logger.info(`✅ Lead ${lead.id} linked to submission ${submission.id}`);
      } catch (leadError) {
        logger.error('Error creating lead:', leadError);
        // Don't fail the form submission if lead creation fails
        await submission.update({
          errors: [{ type: 'lead_creation', message: leadError.message }]
        });
      }
    }

    // Update form submission count
    if (!isSpam) {
      await form.increment('totalSubmissions');
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: form.settings?.successMessage || 'Form submitted successfully!',
      data: {
        submissionId: submission.id,
        leadId: lead?.id,
        status: submission.status,
        redirectUrl: form.settings?.redirectUrl || null
      }
    });

  } catch (error) {
    logger.error('Form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing form submission'
    });
  }
};

/**
 * Get form configuration (public endpoint)
 */
const getForm = async (req, res) => {
  try {
    const { formId } = req.params;

    if (!formId) {
      return res.status(400).json({
        success: false,
        message: 'Form ID is required'
      });
    }

    const form = await Form.findOne({
      where: {
        id: parseInt(formId),
        isActive: true,
        isPublished: true
      },
      attributes: ['id', 'name', 'description', 'fields', 'settings', 'formType']
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or not published'
      });
    }

    res.json({
      success: true,
      data: form
    });

  } catch (error) {
    logger.error('Get form error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving form'
    });
  }
};

/**
 * Get company forms (public endpoint)
 */
const getCompanyForms = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const forms = await Form.findAll({
      where: {
        companyId: parseInt(companyId),
        isActive: true,
        isPublished: true
      },
      attributes: ['id', 'name', 'description', 'fields', 'settings', 'formType'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: forms
    });

  } catch (error) {
    logger.error('Get company forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving company forms'
    });
  }
};

/**
 * Get form submissions (authenticated endpoint for company admin)
 */
const getFormSubmissions = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { formId, page = 1, limit = 20, status } = req.query;

    const where = { companyId };
    if (formId) where.formId = parseInt(formId);
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: submissions } = await FormSubmission.findAndCountAll({
      where,
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'name', 'formType']
        },
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name', 'email', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalSubmissions: count,
          hasMore: offset + submissions.length < count
        }
      }
    });

  } catch (error) {
    logger.error('Get form submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving form submissions'
    });
  }
};

module.exports = {
  submitForm,
  getForm,
  getCompanyForms,
  getFormSubmissions
};
