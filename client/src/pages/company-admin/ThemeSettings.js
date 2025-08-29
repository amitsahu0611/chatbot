import React, { useState, useEffect } from 'react';
import { 
  PaintBrushIcon, 
  EyeIcon, 
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ThemeSettings = () => {
  const { getCurrentCompanyId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [themeData, setThemeData] = useState({
    // Primary Colors
    primaryColor: '#3b82f6',
    primaryBackgroundColor: '#ffffff',
    
    // Secondary Colors
    secondaryColor: '#64748b',
    secondaryBackgroundColor: '#f8fafc',
    
    // Accent Colors
    accentColor: '#10b981',
    accentBackgroundColor: '#ecfdf5',
    
    // Text Colors
    textColor: '#1e293b',
    textSecondaryColor: '#64748b',
    textLightColor: '#94a3b8',
    
    // Border Colors
    borderColor: '#e2e8f0',
    borderLightColor: '#f1f5f9',
    
    // Status Colors
    successColor: '#10b981',
    warningColor: '#f59e0b',
    errorColor: '#ef4444',
    infoColor: '#3b82f6',
    
    // Shadow and Effects
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    
    // Theme Mode
    themeMode: 'light',
    
    // Typography
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    
    // Layout
    borderRadius: '8px',
    spacing: '16px',
    
    // Animation
    enableAnimations: true,
    animationDuration: 300,
    
    // Custom CSS
    customCSS: '',
    
    // Widget Overrides
    widgetOverrides: {}
  });

  useEffect(() => {
    fetchThemeSettings();
  }, []);

  const fetchThemeSettings = async () => {
    try {
      setLoading(true);
      const companyId = getCurrentCompanyId();
      const params = companyId ? `?companyId=${companyId}` : '';
      const response = await api.get(`/company-admin/theme-settings${params}`);
      
      if (response.data.success && response.data.data) {
        setThemeData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching theme settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const companyId = getCurrentCompanyId();
      const params = companyId ? `?companyId=${companyId}` : '';
      await api.put(`/company-admin/theme-settings${params}`, themeData);
      alert('Theme settings saved successfully!');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      alert('Error saving theme settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all theme settings to default?')) {
      try {
        setSaving(true);
        const companyId = getCurrentCompanyId();
        const params = companyId ? `?companyId=${companyId}` : '';
        const response = await api.post(`/company-admin/theme-settings/reset${params}`);
        
        if (response.data.success && response.data.data) {
          setThemeData(response.data.data);
          alert('Theme settings reset to default successfully!');
        }
      } catch (error) {
        console.error('Error resetting theme settings:', error);
        alert('Error resetting theme settings. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleColorChange = (field, value) => {
    setThemeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePreviewCSS = () => {
    return `
      :root {
        --primary-color: ${themeData.primaryColor};
        --primary-bg: ${themeData.primaryBackgroundColor};
        --secondary-color: ${themeData.secondaryColor};
        --secondary-bg: ${themeData.secondaryBackgroundColor};
        --accent-color: ${themeData.accentColor};
        --accent-bg: ${themeData.accentBackgroundColor};
        --text-color: ${themeData.textColor};
        --text-secondary: ${themeData.textSecondaryColor};
        --text-light: ${themeData.textLightColor};
        --border-color: ${themeData.borderColor};
        --border-light: ${themeData.borderLightColor};
        --success-color: ${themeData.successColor};
        --warning-color: ${themeData.warningColor};
        --error-color: ${themeData.errorColor};
        --info-color: ${themeData.infoColor};
        --shadow-color: ${themeData.shadowColor};
        --shadow-opacity: ${themeData.shadowOpacity};
        --font-family: ${themeData.fontFamily};
        --font-size: ${themeData.fontSize};
        --border-radius: ${themeData.borderRadius};
        --spacing: ${themeData.spacing};
        --animation-duration: ${themeData.animationDuration}ms;
      }
      
      ${themeData.customCSS || ''}
    `;
  };

  const ColorPicker = ({ label, value, onChange, description }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="#000000"
        />
      </div>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Theme Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Customize the colors, fonts, and styling for your widgets
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
              previewMode 
                ? 'bg-blue-600 text-white' 
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <EyeIcon className="h-4 w-4" />
            <span>{previewMode ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Theme Settings Form */}
        <div className="space-y-6">
          {/* Primary Colors */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <PaintBrushIcon className="h-5 w-5 mr-2 text-blue-600" />
              Primary Colors
            </h3>
            <div className="space-y-4">
              <ColorPicker
                label="Primary Color"
                value={themeData.primaryColor}
                onChange={(value) => handleColorChange('primaryColor', value)}
                description="Main brand color used for buttons and highlights"
              />
              <ColorPicker
                label="Primary Background"
                value={themeData.primaryBackgroundColor}
                onChange={(value) => handleColorChange('primaryBackgroundColor', value)}
                description="Background color for primary elements"
              />
            </div>
          </div>

          {/* Secondary Colors */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Secondary Colors</h3>
            <div className="space-y-4">
              <ColorPicker
                label="Secondary Color"
                value={themeData.secondaryColor}
                onChange={(value) => handleColorChange('secondaryColor', value)}
                description="Secondary brand color for less prominent elements"
              />
              <ColorPicker
                label="Secondary Background"
                value={themeData.secondaryBackgroundColor}
                onChange={(value) => handleColorChange('secondaryBackgroundColor', value)}
                description="Background color for secondary elements"
              />
            </div>
          </div>

          {/* Accent Colors */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Accent Colors</h3>
            <div className="space-y-4">
              <ColorPicker
                label="Accent Color"
                value={themeData.accentColor}
                onChange={(value) => handleColorChange('accentColor', value)}
                description="Color for success states and positive actions"
              />
              <ColorPicker
                label="Accent Background"
                value={themeData.accentBackgroundColor}
                onChange={(value) => handleColorChange('accentBackgroundColor', value)}
                description="Background color for accent elements"
              />
            </div>
          </div>

          {/* Text Colors */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Text Colors</h3>
            <div className="space-y-4">
              <ColorPicker
                label="Primary Text"
                value={themeData.textColor}
                onChange={(value) => handleColorChange('textColor', value)}
                description="Main text color for headings and body text"
              />
              <ColorPicker
                label="Secondary Text"
                value={themeData.textSecondaryColor}
                onChange={(value) => handleColorChange('textSecondaryColor', value)}
                description="Color for secondary text and captions"
              />
              <ColorPicker
                label="Light Text"
                value={themeData.textLightColor}
                onChange={(value) => handleColorChange('textLightColor', value)}
                description="Color for subtle text and placeholders"
              />
            </div>
          </div>

          {/* Status Colors */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Status Colors</h3>
            <div className="space-y-4">
              <ColorPicker
                label="Success Color"
                value={themeData.successColor}
                onChange={(value) => handleColorChange('successColor', value)}
                description="Color for success messages and confirmations"
              />
              <ColorPicker
                label="Warning Color"
                value={themeData.warningColor}
                onChange={(value) => handleColorChange('warningColor', value)}
                description="Color for warning messages and alerts"
              />
              <ColorPicker
                label="Error Color"
                value={themeData.errorColor}
                onChange={(value) => handleColorChange('errorColor', value)}
                description="Color for error messages and critical alerts"
              />
              <ColorPicker
                label="Info Color"
                value={themeData.infoColor}
                onChange={(value) => handleColorChange('infoColor', value)}
                description="Color for informational messages"
              />
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Typography</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Family
                </label>
                <input
                  type="text"
                  value={themeData.fontFamily}
                  onChange={(e) => handleColorChange('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Inter, system-ui, sans-serif"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Size
                </label>
                <input
                  type="text"
                  value={themeData.fontSize}
                  onChange={(e) => handleColorChange('fontSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="14px"
                />
              </div>
            </div>
          </div>

          {/* Custom CSS */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Custom CSS</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional CSS Rules
              </label>
              <textarea
                value={themeData.customCSS}
                onChange={(e) => handleColorChange('customCSS', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="/* Add custom CSS rules here */"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add custom CSS rules to override default styles. These will be applied after the theme variables.
              </p>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {previewMode && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Live Preview</h3>
              <div className="space-y-4">
                <style>{generatePreviewCSS()}</style>
                
                {/* Button Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Buttons</h4>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-[var(--border-radius)]">
                      Primary Button
                    </button>
                    <button className="px-4 py-2 bg-[var(--secondary-bg)] text-[var(--secondary-color)] border border-[var(--border-color)] rounded-[var(--border-radius)]">
                      Secondary Button
                    </button>
                  </div>
                </div>

                {/* Text Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Typography</h4>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>
                      Heading Text
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Secondary text color example
                    </p>
                    <p style={{ color: 'var(--text-light)' }}>
                      Light text color example
                    </p>
                  </div>
                </div>

                {/* Status Colors Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Status Colors</h4>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: 'var(--success-color)', color: 'white' }}>
                      Success
                    </span>
                    <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: 'var(--warning-color)', color: 'white' }}>
                      Warning
                    </span>
                    <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: 'var(--error-color)', color: 'white' }}>
                      Error
                    </span>
                    <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: 'var(--info-color)', color: 'white' }}>
                      Info
                    </span>
                  </div>
                </div>

                {/* Card Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Card Example</h4>
                  <div 
                    className="p-4 rounded-[var(--border-radius)]"
                    style={{ 
                      backgroundColor: 'var(--primary-bg)',
                      border: `1px solid var(--border-color)`,
                      boxShadow: `0 2px 4px var(--shadow-color)`
                    }}
                  >
                    <h5 className="font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                      Sample Card
                    </h5>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      This is how your widgets will look with the current theme settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CSS Variables Output */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generated CSS Variables</h3>
              <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
                <code>{generatePreviewCSS()}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeSettings;
