import React, { useState, useEffect } from 'react';
import {
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CogIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const SupportSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [testResults, setTestResults] = useState({});
  const [businessHoursStatus, setBusinessHoursStatus] = useState(null);

  // Form states
  const [phoneSettings, setPhoneSettings] = useState({});
  const [emailSettings, setEmailSettings] = useState({});
  const [chatSettings, setChatSettings] = useState({});
  const [socialSettings, setSocialSettings] = useState({});
  const [escalationSettings, setEscalationSettings] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});
  const [businessHours, setBusinessHours] = useState({});
  const [timezone, setTimezone] = useState('UTC');

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'phone', name: 'Phone', icon: PhoneIcon },
    { id: 'email', name: 'Email', icon: EnvelopeIcon },
    { id: 'chat', name: 'Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'social', name: 'Social', icon: ChatBubbleLeftRightIcon },
    { id: 'escalation', name: 'Escalation', icon: ExclamationTriangleIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'business-hours', name: 'Business Hours', icon: ClockIcon }
  ];

  useEffect(() => {
    fetchSettings();
    fetchBusinessHoursStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/company-admin/support-settings');
      const data = response.data.data;
      setSettings(data);
      
      // Initialize form states
      setPhoneSettings(data.phone || {});
      setEmailSettings(data.email || {});
      setChatSettings(data.chat || {});
      setSocialSettings(data.social || {});
      setEscalationSettings(data.escalation || {});
      setNotificationSettings(data.notifications || {});
      setBusinessHours(data.businessHours || {});
      setTimezone(data.timezone || 'UTC');
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessHoursStatus = async () => {
    try {
      const response = await api.get('/company-admin/support-settings/business-hours-status');
      setBusinessHoursStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching business hours status:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updateData = {
        phone: phoneSettings,
        email: emailSettings,
        chat: chatSettings,
        social: socialSettings,
        escalation: escalationSettings,
        notifications: notificationSettings,
        businessHours,
        timezone
      };

      const response = await api.put('/company-admin/support-settings', updateData);
      setSettings(response.data.data);
      
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const testEmail = prompt('Enter email address to test:');
      if (!testEmail) return;

      const response = await api.post('/company-admin/support-settings/test-email', { email: testEmail });
      setTestResults(prev => ({
        ...prev,
        email: { success: true, message: 'Test email sent successfully!' }
      }));
      
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, email: null }));
      }, 3000);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        email: { success: false, message: 'Failed to send test email.' }
      }));
    }
  };

  const handleTestPhone = async () => {
    try {
      const testPhone = prompt('Enter phone number to test:');
      if (!testPhone) return;

      const response = await api.post('/company-admin/support-settings/test-phone', { phone: testPhone });
      setTestResults(prev => ({
        ...prev,
        phone: { success: true, message: 'Test call initiated successfully!' }
      }));
      
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, phone: null }));
      }, 3000);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        phone: { success: false, message: 'Failed to initiate test call.' }
      }));
    }
  };

  const handleTestSlack = async () => {
    try {
      const webhookUrl = notificationSettings.slack?.webhookUrl;
      if (!webhookUrl) {
        alert('Please configure Slack webhook URL first.');
        return;
      }

      const response = await api.post('/company-admin/support-settings/test-slack', {
        webhookUrl,
        channel: notificationSettings.slack?.channel || ''
      });
      
      setTestResults(prev => ({
        ...prev,
        slack: { success: true, message: 'Test Slack message sent successfully!' }
      }));
      
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, slack: null }));
      }, 3000);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        slack: { success: false, message: 'Failed to send test Slack message.' }
      }));
    }
  };

  const handleResetToDefault = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.post('/company-admin/support-settings/reset');
      setSettings(response.data.data);
      
      // Reset form states
      setPhoneSettings(response.data.data.phone);
      setEmailSettings(response.data.data.email);
      setChatSettings(response.data.data.chat);
      setSocialSettings(response.data.data.social);
      setEscalationSettings(response.data.data.escalation);
      setNotificationSettings(response.data.data.notifications);
      setBusinessHours(response.data.data.businessHours);
      setTimezone(response.data.data.timezone);
      
      alert('Settings reset to default successfully!');
    } catch (error) {
      console.error('Error resetting settings:', error);
      alert('Error resetting settings. Please try again.');
    }
  };

  const addEscalationRule = () => {
    const newRule = {
      condition: 'response_time',
      threshold: 24,
      action: 'email',
      recipients: []
    };
    setEscalationSettings(prev => ({
      ...prev,
      rules: [...(prev.rules || []), newRule]
    }));
  };

  const removeEscalationRule = (index) => {
    setEscalationSettings(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const updateEscalationRule = (index, field, value) => {
    setEscalationSettings(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const addEmailRecipient = () => {
    const email = prompt('Enter email address:');
    if (email) {
      setNotificationSettings(prev => ({
        ...prev,
        email: {
          ...prev.email,
          recipients: [...(prev.email?.recipients || []), email]
        }
      }));
    }
  };

  const removeEmailRecipient = (index) => {
    setNotificationSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        recipients: prev.email.recipients.filter((_, i) => i !== index)
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure support contact information and escalation settings
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleResetToDefault}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Business Hours Status */}
      {businessHoursStatus && (
        <div className={`p-4 rounded-lg border ${
          businessHoursStatus.isOpen 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            {businessHoursStatus.isOpen ? (
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            )}
            <span className={`font-medium ${
              businessHoursStatus.isOpen ? 'text-green-800' : 'text-red-800'
            }`}>
              {businessHoursStatus.isOpen ? 'Currently Open' : 'Currently Closed'}
            </span>
            <span className="ml-2 text-sm text-gray-600">
              ({businessHoursStatus.currentDay} {businessHoursStatus.currentTime} {businessHoursStatus.timezone})
            </span>
          </div>
        </div>
      )}

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="space-y-2">
          {Object.entries(testResults).map(([key, result]) => result && (
            <div key={key} className={`p-3 rounded-md ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {result.success ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                ) : (
                  <XCircleIcon className="h-4 w-4 text-red-400 mr-2" />
                )}
                <span className={`text-sm ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time</option>
                    <option value="CST">Central Time</option>
                    <option value="MST">Mountain Time</option>
                    <option value="PST">Pacific Time</option>
                    <option value="GMT">GMT</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'phone' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Phone Support</h3>
                <button
                  onClick={handleTestPhone}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Test Phone
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={phoneSettings.enabled || false}
                      onChange={(e) => setPhoneSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Phone Support</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneSettings.number || ''}
                    onChange={(e) => setPhoneSettings(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1-800-123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Hours
                  </label>
                  <input
                    type="text"
                    value={phoneSettings.hours || ''}
                    onChange={(e) => setPhoneSettings(prev => ({ ...prev, hours: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Monday to Friday, 9 AM to 6 PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extension
                  </label>
                  <input
                    type="text"
                    value={phoneSettings.extension || ''}
                    onChange={(e) => setPhoneSettings(prev => ({ ...prev, extension: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Email Support</h3>
                <button
                  onClick={handleTestEmail}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Test Email
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={emailSettings.enabled || false}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Email Support</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={emailSettings.address || ''}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="support@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Time
                  </label>
                  <input
                    type="text"
                    value={emailSettings.responseTime || ''}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, responseTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Within 24 hours"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={emailSettings.autoReply || false}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, autoReply: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Auto Reply</span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto Reply Message
                  </label>
                  <textarea
                    value={emailSettings.autoReplyMessage || ''}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, autoReplyMessage: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Thank you for contacting us. We will get back to you within 24 hours."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chat Support</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={chatSettings.enabled || false}
                      onChange={(e) => setChatSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Chat Support</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Hours
                  </label>
                  <input
                    type="text"
                    value={chatSettings.hours || ''}
                    onChange={(e) => setChatSettings(prev => ({ ...prev, hours: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Monday to Friday, 9 AM to 6 PM"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <input
                    type="text"
                    value={chatSettings.welcomeMessage || ''}
                    onChange={(e) => setChatSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hello! How can I help you today?"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offline Message
                  </label>
                  <input
                    type="text"
                    value={chatSettings.offlineMessage || ''}
                    onChange={(e) => setChatSettings(prev => ({ ...prev, offlineMessage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="We are currently offline. Please leave a message and we will get back to you."
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={chatSettings.autoAssign || false}
                      onChange={(e) => setChatSettings(prev => ({ ...prev, autoAssign: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Auto Assign Chats</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Wait Time (seconds)
                  </label>
                  <input
                    type="number"
                    value={chatSettings.maxWaitTime || 300}
                    onChange={(e) => setChatSettings(prev => ({ ...prev, maxWaitTime: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="60"
                    max="3600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-6">
            {/* WhatsApp */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">WhatsApp</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={socialSettings.whatsapp?.enabled || false}
                      onChange={(e) => setSocialSettings(prev => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, enabled: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable WhatsApp</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={socialSettings.whatsapp?.number || ''}
                    onChange={(e) => setSocialSettings(prev => ({
                      ...prev,
                      whatsapp: { ...prev.whatsapp, number: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Telegram */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Telegram</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={socialSettings.telegram?.enabled || false}
                      onChange={(e) => setSocialSettings(prev => ({
                        ...prev,
                        telegram: { ...prev.telegram, enabled: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Telegram</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bot Username
                  </label>
                  <input
                    type="text"
                    value={socialSettings.telegram?.username || ''}
                    onChange={(e) => setSocialSettings(prev => ({
                      ...prev,
                      telegram: { ...prev.telegram, username: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="@your_bot"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bot Token
                  </label>
                  <input
                    type="password"
                    value={socialSettings.telegram?.botToken || ''}
                    onChange={(e) => setSocialSettings(prev => ({
                      ...prev,
                      telegram: { ...prev.telegram, botToken: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'escalation' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Escalation Rules</h3>
                <button
                  onClick={addEscalationRule}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Rule
                </button>
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={escalationSettings.enabled || false}
                    onChange={(e) => setEscalationSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Enable Escalation Rules</span>
                </label>
              </div>

              <div className="space-y-4">
                {escalationSettings.rules?.map((rule, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-sm font-medium text-gray-900">Rule {index + 1}</h4>
                      <button
                        onClick={() => removeEscalationRule(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condition
                        </label>
                        <select
                          value={rule.condition}
                          onChange={(e) => updateEscalationRule(index, 'condition', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="response_time">Response Time</option>
                          <option value="priority">Priority</option>
                          <option value="category">Category</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Threshold
                        </label>
                        <input
                          type="number"
                          value={rule.threshold}
                          onChange={(e) => updateEscalationRule(index, 'threshold', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Action
                        </label>
                        <select
                          value={rule.action}
                          onChange={(e) => updateEscalationRule(index, 'action', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="phone">Phone</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email?.enabled || false}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, enabled: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Email Notifications</span>
                  </label>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Notification Recipients
                    </label>
                    <button
                      onClick={addEmailRecipient}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {notificationSettings.email?.recipients?.map((email, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            const newRecipients = [...notificationSettings.email.recipients];
                            newRecipients[index] = e.target.value;
                            setNotificationSettings(prev => ({
                              ...prev,
                              email: { ...prev.email, recipients: newRecipients }
                            }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeEmailRecipient(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Slack Notifications */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Slack Notifications</h3>
                <button
                  onClick={handleTestSlack}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <BellIcon className="h-4 w-4 mr-2" />
                  Test Slack
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationSettings.slack?.enabled || false}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        slack: { ...prev.slack, enabled: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Slack Notifications</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={notificationSettings.slack?.webhookUrl || ''}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      slack: { ...prev.slack, webhookUrl: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel
                  </label>
                  <input
                    type="text"
                    value={notificationSettings.slack?.channel || ''}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      slack: { ...prev.slack, channel: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#support"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business-hours' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Hours</h3>
              <div className="space-y-4">
                {Object.entries(businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-24">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={hours.enabled || false}
                          onChange={(e) => setBusinessHours(prev => ({
                            ...prev,
                            [day]: { ...prev[day], enabled: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                          {day}
                        </span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={hours.start || '09:00'}
                        onChange={(e) => setBusinessHours(prev => ({
                          ...prev,
                          [day]: { ...prev[day], start: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={hours.end || '17:00'}
                        onChange={(e) => setBusinessHours(prev => ({
                          ...prev,
                          [day]: { ...prev[day], end: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportSettings;
