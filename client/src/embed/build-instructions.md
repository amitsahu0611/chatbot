# 🔨 Widget Build Instructions

This guide explains how to build and deploy the Nowgray Chat Widget for embedding on external websites.

## 📋 Prerequisites

- Node.js 14+ and npm 6+
- Webpack 5+
- Babel for ES6+ compilation

## 🛠️ Build Process

### 1. Install Dependencies

```bash
# Install build dependencies
npm install --save-dev @babel/core @babel/preset-env @babel/preset-react
npm install --save-dev babel-loader webpack webpack-cli clean-webpack-plugin
npm install --save-dev css-loader style-loader postcss-loader
npm install --save-dev terser-webpack-plugin
```

### 2. Build Widget

```bash
# Production build
npm run build:widget

# Development build (with watch)
npm run build:widget:dev

# Clean build directory
npm run clean:widget
```

### 3. Build Output

The build process creates:

```
dist/widget/
├── widget-loader.min.js      # Main initialization script
├── chat-widget.min.js        # React component bundle
├── vendors.min.js            # Third-party dependencies
├── widget-loader.min.js.map  # Source maps
└── chat-widget.min.js.map    # Source maps
```

## 🚀 Deployment

### 1. CDN Deployment

Upload build files to your CDN:

```bash
# Example: AWS S3 + CloudFront
aws s3 sync dist/widget/ s3://your-cdn-bucket/widget/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/widget/*"
```

### 2. Server Integration

Add to your main server's static files:

```bash
# Copy to public directory
cp -r dist/widget/ /path/to/your/server/public/
```

### 3. Update Script URLs

Update the widget loader script URL in your documentation and examples:

```html
<!-- Replace localhost with your domain -->
<script src="https://your-domain.com/widget/widget-loader.min.js"></script>
```

## 📊 Bundle Analysis

Analyze bundle size and dependencies:

```bash
# Install bundle analyzer
npm install --save-dev webpack-bundle-analyzer

# Analyze bundles
npx webpack-bundle-analyzer dist/widget/
```

## 🧪 Testing Widget

### 1. Local Testing

```bash
# Start local server
npm run serve:widget

# Open test page
open http://localhost:8080/example.html
```

### 2. Production Testing

Test on different websites:

```html
<!-- Test script -->
<script>
(function() {
  const script = document.createElement('script');
  script.src = 'https://your-domain.com/widget/widget-loader.min.js';
  script.setAttribute('data-nowgray-company-id', 'test-company-123');
  script.setAttribute('data-nowgray-debug', 'true');
  document.head.appendChild(script);
})();
</script>
```

## ⚡ Performance Optimization

### 1. Code Splitting

The widget uses code splitting to load dependencies only when needed:

- Initial load: ~15KB (gzipped)
- With React: ~45KB (gzipped)
- Full widget: ~65KB (gzipped)

### 2. Caching Strategy

Set appropriate cache headers:

```nginx
# Nginx configuration
location /widget/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
}
```

### 3. Preloading

Optimize loading with preload hints:

```html
<link rel="preload" href="https://your-domain.com/widget/widget-loader.min.js" as="script">
<link rel="dns-prefetch" href="https://your-api-domain.com">
```

## 🔒 Security Considerations

### 1. Content Security Policy

Add to your CSP headers:

```
script-src 'self' https://your-domain.com;
connect-src 'self' https://your-api-domain.com;
style-src 'self' 'unsafe-inline';
```

### 2. CORS Configuration

Configure API server CORS:

```javascript
// Express.js example
app.use(cors({
  origin: ['https://your-domain.com', 'https://customer-websites.com'],
  credentials: true
}));
```

## 📱 Browser Support

The widget supports:

- Chrome 70+ (95% coverage)
- Firefox 65+ (4% coverage)
- Safari 12+ (3% coverage)
- Edge 79+ (2% coverage)
- IE 11 (legacy support)

### Polyfills

For older browsers, include polyfills:

```html
<script src="https://polyfill.io/v3/polyfill.min.js?features=default,fetch,Promise"></script>
```

## 📈 Monitoring

### 1. Error Tracking

Monitor widget errors:

```javascript
window.addEventListener('error', function(event) {
  if (event.filename.includes('widget-loader')) {
    // Send error to monitoring service
    console.error('Widget Error:', event);
  }
});
```

### 2. Performance Monitoring

Track loading performance:

```javascript
window.addEventListener('nowgray-widget-loaded', function(event) {
  const loadTime = performance.now();
  // Send metrics to analytics
  analytics.track('Widget Loaded', { loadTime });
});
```

## 🔄 Updates & Versioning

### 1. Semantic Versioning

Follow semantic versioning:

- `1.0.0` - Major release (breaking changes)
- `1.1.0` - Minor release (new features)
- `1.1.1` - Patch release (bug fixes)

### 2. Update Strategy

For updates:

1. Build new version
2. Deploy to staging environment
3. Test thoroughly
4. Deploy to production CDN
5. Update documentation
6. Notify customers of breaking changes

### 3. Backward Compatibility

Maintain backward compatibility:

```javascript
// Support old configuration format
if (config.brandColor && !config.primaryColor) {
  config.primaryColor = config.brandColor;
}
```

## 🆘 Troubleshooting

### Common Build Issues

1. **Babel compilation errors**
   ```bash
   # Check Babel configuration
   npx babel --version
   npx babel src/embed/widget-loader.js
   ```

2. **Webpack bundle errors**
   ```bash
   # Verbose webpack output
   npx webpack --config widget-build.config.js --stats verbose
   ```

3. **Missing dependencies**
   ```bash
   # Check for missing peer dependencies
   npm ls --depth=0
   ```

### Runtime Issues

1. **Widget not loading**
   - Check network requests in browser dev tools
   - Verify script URL is accessible
   - Check console for JavaScript errors

2. **Styling conflicts**
   - Use browser dev tools to inspect CSS
   - Check for conflicting z-index values
   - Verify CSS isolation is working

3. **API connection issues**
   - Check CORS configuration
   - Verify API endpoints are accessible
   - Check authentication/authorization

---

For more help, contact: support@nowgray.com
