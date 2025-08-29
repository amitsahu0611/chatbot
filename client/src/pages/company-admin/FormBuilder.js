import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  DocumentDuplicateIcon,
  CogIcon,
  ChartBarIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const FormBuilder = () => {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [],
    settings: {
      submitButtonText: 'Submit',
      successMessage: 'Thank you! Your submission has been received.',
      redirectUrl: '',
      emailNotifications: {
        enabled: false,
        recipients: []
      }
    }
  });

  // Available field types
  const fieldTypes = [
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'email', label: 'Email Input', icon: '📧' },
    { type: 'textarea', label: 'Text Area', icon: '📄' },
    { type: 'select', label: 'Dropdown', icon: '📋' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { type: 'radio', label: 'Radio Buttons', icon: '🔘' },
    { type: 'number', label: 'Number Input', icon: '🔢' },
    { type: 'phone', label: 'Phone Input', icon: '📞' },
    { type: 'date', label: 'Date Picker', icon: '📅' }
  ];

  useEffect(() => {
    fetchForms();
  }, [currentPage, searchTerm]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/company-admin/form-builder?page=${currentPage}&search=${searchTerm}`);
      setForms(response.data.data);
      setTotalPages(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    setFormData({
      name: '',
      description: '',
      fields: [],
      settings: {
        submitButtonText: 'Submit',
        successMessage: 'Thank you! Your submission has been received.',
        redirectUrl: '',
        emailNotifications: {
          enabled: false,
          recipients: []
        }
      }
    });
    setIsCreating(true);
    setIsEditing(false);
    setSelectedForm(null);
  };

  const handleEditForm = (form) => {
    setFormData({
      name: form.name,
      description: form.description,
      fields: form.fields,
      settings: form.settings || {
        submitButtonText: 'Submit',
        successMessage: 'Thank you! Your submission has been received.',
        redirectUrl: '',
        emailNotifications: {
          enabled: false,
          recipients: []
        }
      }
    });
    setSelectedForm(form);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSaveForm = async () => {
    try {
      if (isEditing) {
        await api.put(`/company-admin/form-builder/${selectedForm._id}`, formData);
      } else {
        await api.post('/company-admin/form-builder', formData);
      }
      
      setIsCreating(false);
      setIsEditing(false);
      setSelectedForm(null);
      fetchForms();
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await api.delete(`/company-admin/form-builder/${formId}`);
        fetchForms();
      } catch (error) {
        console.error('Error deleting form:', error);
      }
    }
  };

  const handleDuplicateForm = async (formId) => {
    try {
      await api.post(`/company-admin/form-builder/${formId}/duplicate`);
      fetchForms();
    } catch (error) {
      console.error('Error duplicating form:', error);
    }
  };

  const addField = (fieldType) => {
    const newField = {
      type: fieldType,
      label: `New ${fieldType} field`,
      placeholder: '',
      required: false,
      options: fieldType === 'select' || fieldType === 'radio' ? ['Option 1', 'Option 2'] : [],
      validation: {},
      order: formData.fields.length
    };

    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    });
  };

  const updateField = (index, field) => {
    const updatedFields = [...formData.fields];
    updatedFields[index] = field;
    setFormData({
      ...formData,
      fields: updatedFields
    });
  };

  const removeField = (index) => {
    const updatedFields = formData.fields.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      fields: updatedFields
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedFields = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setFormData({
      ...formData,
      fields: updatedFields
    });
  };

  const FieldEditor = ({ field, index }) => {
    const [localField, setLocalField] = useState(field);

    const handleFieldChange = (key, value) => {
      const updatedField = { ...localField, [key]: value };
      setLocalField(updatedField);
      updateField(index, updatedField);
    };

    const addOption = () => {
      const updatedField = {
        ...localField,
        options: [...(localField.options || []), `Option ${(localField.options || []).length + 1}`]
      };
      setLocalField(updatedField);
      updateField(index, updatedField);
    };

    const removeOption = (optionIndex) => {
      const updatedField = {
        ...localField,
        options: localField.options.filter((_, i) => i !== optionIndex)
      };
      setLocalField(updatedField);
      updateField(index, updatedField);
    };

    const updateOption = (optionIndex, value) => {
      const updatedField = {
        ...localField,
        options: localField.options.map((option, i) => i === optionIndex ? value : option)
      };
      setLocalField(updatedField);
      updateField(index, updatedField);
    };

    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">{fieldTypes.find(f => f.type === field.type)?.label}</h4>
          <button
            onClick={() => removeField(index)}
            className="text-red-500 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={localField.label}
              onChange={(e) => handleFieldChange('label', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
            <input
              type="text"
              value={localField.placeholder || ''}
              onChange={(e) => handleFieldChange('placeholder', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={localField.required}
              onChange={(e) => handleFieldChange('required', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Required field</label>
          </div>

          {(field.type === 'select' || field.type === 'radio') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                {(localField.options || []).map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(optionIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeOption(optionIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const FormPreview = () => {
    const [previewData, setPreviewData] = useState({});

    const handlePreviewSubmit = (e) => {
      e.preventDefault();
      alert('Form submitted! (Preview mode)');
    };

    const renderField = (field) => {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'number':
        case 'phone':
          return (
            <input
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          );
        case 'textarea':
          return (
            <textarea
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          );
        case 'select':
          return (
            <select
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an option</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          );
        case 'checkbox':
          return (
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`checkbox-${index}`}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`checkbox-${index}`} className="ml-2 text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          );
        case 'radio':
          return (
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    name={`radio-${field.label}`}
                    id={`radio-${index}`}
                    required={field.required}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`radio-${index}`} className="ml-2 text-sm text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          );
        case 'date':
          return (
            <input
              type="date"
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          );
        default:
          return null;
      }
    };

    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Form Preview</h3>
        <form onSubmit={handlePreviewSubmit} className="space-y-4">
          {(formData.fields || []).map((field, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {formData.settings?.submitButtonText || 'Submit'}
          </button>
        </form>
      </div>
    );
  };

  const FormSettings = () => {
    const [settings, setSettings] = useState(formData.settings || {
      submitButtonText: 'Submit',
      successMessage: 'Thank you! Your submission has been received.',
      redirectUrl: '',
      emailNotifications: {
        enabled: false,
        recipients: []
      }
    });

    const handleSettingChange = (key, value) => {
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);
      setFormData({
        ...formData,
        settings: updatedSettings
      });
    };

    const handleEmailRecipientChange = (index, value) => {
      const updatedRecipients = [...(settings.emailNotifications?.recipients || [])];
      updatedRecipients[index] = value;
      handleSettingChange('emailNotifications', {
        ...settings.emailNotifications,
        recipients: updatedRecipients
      });
    };

    const addEmailRecipient = () => {
      const updatedRecipients = [...(settings.emailNotifications?.recipients || []), ''];
      handleSettingChange('emailNotifications', {
        ...settings.emailNotifications,
        recipients: updatedRecipients
      });
    };

    const removeEmailRecipient = (index) => {
      const updatedRecipients = (settings.emailNotifications?.recipients || []).filter((_, i) => i !== index);
      handleSettingChange('emailNotifications', {
        ...settings.emailNotifications,
        recipients: updatedRecipients
      });
    };

    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Form Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submit Button Text</label>
            <input
              type="text"
              value={settings.submitButtonText}
              onChange={(e) => handleSettingChange('submitButtonText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Success Message</label>
            <textarea
              value={settings.successMessage}
              onChange={(e) => handleSettingChange('successMessage', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL (optional)</label>
            <input
              type="url"
              value={settings.redirectUrl || ''}
              onChange={(e) => handleSettingChange('redirectUrl', e.target.value)}
              placeholder="https://example.com/thank-you"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={settings.emailNotifications.enabled}
                onChange={(e) => handleSettingChange('emailNotifications', {
                  ...settings.emailNotifications,
                  enabled: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">Email Notifications</label>
            </div>
            
            {settings.emailNotifications.enabled && (
              <div className="ml-6 space-y-2">
                <label className="block text-sm text-gray-700">Recipients</label>
                {settings.emailNotifications.recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => handleEmailRecipientChange(index, e.target.value)}
                      placeholder="email@example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeEmailRecipient(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addEmailRecipient}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Recipient
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isCreating || isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Form' : 'Create New Form'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Modify your form configuration' : 'Build a new lead capture form'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
                setSelectedForm(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Form
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter form name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter form description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Field Types */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Fields</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fieldTypes.map((fieldType) => (
                  <button
                    key={fieldType.type}
                    onClick={() => addField(fieldType.type)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left"
                  >
                    <div className="text-2xl mb-1">{fieldType.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{fieldType.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Form Fields</h3>
              {formData.fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No fields added yet. Click on a field type above to add fields to your form.</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="fields">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {formData.fields.map((field, index) => (
                          <Draggable key={index} draggableId={`field-${index}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <FieldEditor field={field} index={index} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  showPreview
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <EyeIcon className="h-4 w-4 inline mr-1" />
                Preview
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  showSettings
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CogIcon className="h-4 w-4 inline mr-1" />
                Settings
              </button>
            </div>

            {showPreview && <FormPreview />}
            {showSettings && <FormSettings />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage lead capture forms with drag-and-drop interface
          </p>
        </div>
        <button
          onClick={handleCreateForm}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Form
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No forms found. Create your first form to get started.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fields
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forms.map((form) => (
                  <tr key={form._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{form.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {form.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{form.fields?.length || 0} fields</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{form.submissions || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        form.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {form.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(form.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditForm(form)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <CogIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateForm(form._id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteForm(form._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
