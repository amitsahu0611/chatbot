const User = require('./User');
const Company = require('./Company');
const Product = require('./Product');
const FAQ = require('./company-admin/faq-manager/FAQ');
const UnansweredQuery = require('./company-admin/faq-manager/UnansweredQuery');
const SupportSettings = require('./company-admin/support-settings/SupportSettings');
const Lead = require('./company-admin/lead-viewer/Lead');
const Form = require('./company-admin/form-builder/Form');
const FormSubmission = require('./company-admin/form-builder/FormSubmission');
const ActivityLog = require('./ActivityLog');
const VisitorSession = require('./widget/VisitorSession');

// Define associations
Company.hasMany(User, {
  foreignKey: 'companyId',
  as: 'users'
});

User.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

// FAQ associations
FAQ.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'createdByUser'
});

FAQ.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updatedByUser'
});

User.hasMany(FAQ, {
  foreignKey: 'createdBy',
  as: 'createdFAQs'
});

User.hasMany(FAQ, {
  foreignKey: 'updatedBy',
  as: 'updatedFAQs'
});

// SupportSettings associations
SupportSettings.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'createdByUser'
});

SupportSettings.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updatedByUser'
});

User.hasMany(SupportSettings, {
  foreignKey: 'createdBy',
  as: 'createdSupportSettings'
});

User.hasMany(SupportSettings, {
  foreignKey: 'updatedBy',
  as: 'updatedSupportSettings'
});

// Lead associations
Lead.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignedUser'
});

User.hasMany(Lead, {
  foreignKey: 'assignedTo',
  as: 'assignedLeads'
});

// Form associations
Form.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

Company.hasMany(Form, {
  foreignKey: 'companyId',
  as: 'forms'
});

// FormSubmission associations
FormSubmission.belongsTo(Form, {
  foreignKey: 'formId',
  as: 'form'
});

FormSubmission.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

FormSubmission.belongsTo(Lead, {
  foreignKey: 'leadId',
  as: 'lead'
});

Form.hasMany(FormSubmission, {
  foreignKey: 'formId',
  as: 'submissions'
});

Company.hasMany(FormSubmission, {
  foreignKey: 'companyId',
  as: 'formSubmissions'
});

Lead.hasMany(FormSubmission, {
  foreignKey: 'leadId',
  as: 'formSubmissions'
});

// UnansweredQuery associations
UnansweredQuery.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

UnansweredQuery.belongsTo(FAQ, {
  foreignKey: 'relatedFaqId',
  as: 'relatedFaq'
});

Company.hasMany(UnansweredQuery, {
  foreignKey: 'companyId',
  as: 'unansweredQueries'
});

FAQ.hasMany(UnansweredQuery, {
  foreignKey: 'relatedFaqId',
  as: 'relatedQueries'
});

// ActivityLog associations
ActivityLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

ActivityLog.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

User.hasMany(ActivityLog, {
  foreignKey: 'userId',
  as: 'activities'
});

Company.hasMany(ActivityLog, {
  foreignKey: 'companyId',
  as: 'activities'
});

// VisitorSession associations
Company.hasMany(VisitorSession, {
  foreignKey: 'companyId',
  as: 'visitorSessions'
});

VisitorSession.belongsTo(Company, {
  foreignKey: 'companyId',
  as: 'company'
});

module.exports = {
  User,
  Company,
  Product,
  FAQ,
  UnansweredQuery,
  SupportSettings,
  Lead,
  Form,
  FormSubmission,
  ActivityLog,
  VisitorSession
};
