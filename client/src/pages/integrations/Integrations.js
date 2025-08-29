import React from 'react';

const Integrations = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your chatbot with external services and platforms
        </p>
      </div>
      
      <div className="card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Integrations</h3>
          <p className="text-gray-500">
            This page will contain integration settings for WhatsApp, Telegram, Slack, and other platforms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
