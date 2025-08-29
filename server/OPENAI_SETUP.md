# OpenAI API Setup Guide

## 🔧 How to Configure OpenAI API Key

The enhanced chat widget uses OpenAI's GPT models to provide intelligent responses. Here's how to set it up:

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in your dashboard
4. Click "Create new secret key"
5. Copy the generated API key

### 2. Configure the API Key

1. Open `server/config.env`
2. Find the line: `OPENAI_API_KEY=your-openai-api-key-here`
3. Replace `your-openai-api-key-here` with your actual API key
4. Save the file

Example:
```env
OPENAI_API_KEY=sk-1234567890abcdef1234567890abcdef1234567890abcdef
```

### 3. Restart the Server

After updating the API key, restart your server:

```bash
cd server
npm start
```

### 4. Verify Configuration

The system will automatically detect if the API key is configured:
- ✅ **Configured**: Uses OpenAI GPT for intelligent responses
- ⚠️ **Not Configured**: Uses intelligent fallback responses (still works!)

### 🔄 Fallback System

If the OpenAI API key is not configured, the system will automatically use an intelligent fallback response system that:
- Provides helpful responses based on available FAQs
- Handles common questions about services, support, pricing, and hours
- Maintains a professional and helpful tone
- Suggests contacting support when needed

### 💡 Benefits of OpenAI Integration

With OpenAI API configured, the chat widget can:
- Provide more natural and contextual responses
- Handle complex questions with better understanding
- Generate responses based on company-specific FAQ data
- Maintain conversation flow more effectively

### 🔒 Security Note

- Never commit your API key to version control
- Keep your API key secure and don't share it publicly
- Monitor your OpenAI usage to control costs

### 🆘 Need Help?

If you need assistance setting up the OpenAI API:
1. Check the [OpenAI Documentation](https://platform.openai.com/docs)
2. Verify your API key is valid
3. Ensure you have sufficient credits in your OpenAI account
