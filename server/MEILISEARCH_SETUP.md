# MeiliSearch Setup Guide

This guide will help you set up MeiliSearch for the advanced product search functionality.

## Installation Options

### Option 1: Using Docker (Recommended)

1. **Install Docker** if you haven't already
2. **Run MeiliSearch container**:
   ```bash
   docker run -it --rm \
     -p 7700:7700 \
     -v $(pwd)/meili_data:/meili_data \
     getmeili/meilisearch:v1.5
   ```

### Option 2: Direct Installation

#### Windows
1. Download the latest release from: https://github.com/meilisearch/meilisearch/releases
2. Extract the executable
3. Run: `./meilisearch.exe`

#### macOS
```bash
# Using Homebrew
brew install meilisearch

# Or using curl
curl -L https://install.meilisearch.com | sh
./meilisearch
```

#### Linux
```bash
# Using curl
curl -L https://install.meilisearch.com | sh
./meilisearch
```

## Configuration

1. **Start MeiliSearch** (it will run on http://127.0.0.1:7700 by default)

2. **Update environment variables** in `config.env`:
   ```env
   MEILISEARCH_HOST=http://127.0.0.1:7700
   MEILISEARCH_API_KEY=
   ```

3. **Sync existing products** to MeiliSearch:
   ```bash
   cd server
   node sync-products-to-meilisearch.js
   ```

## Verification

1. **Check MeiliSearch is running**:
   - Open http://127.0.0.1:7700 in your browser
   - You should see the MeiliSearch interface

2. **Test the search functionality**:
   - Start your server: `npm start`
   - Navigate to: http://localhost:5173/super-admin/product-search
   - Try searching for products

## Features

The MeiliSearch integration provides:

- ⚡ **Lightning-fast search** (sub-millisecond response times)
- 🔍 **Typo tolerance** (finds results even with spelling mistakes)
- 🎯 **Intelligent ranking** (most relevant results first)
- 📝 **Auto-complete suggestions** (real-time search suggestions)
- 🏷️ **Faceted search** (filter by brand, category, price, etc.)
- 🔤 **Highlighting** (search terms highlighted in results)
- 📊 **Analytics** (search performance metrics)

## Troubleshooting

### MeiliSearch not starting
- Check if port 7700 is available
- Try running on a different port: `./meilisearch --http-addr 127.0.0.1:7701`
- Update `MEILISEARCH_HOST` in config.env accordingly

### Products not syncing
- Ensure MeiliSearch is running
- Check server logs for errors
- Try running the sync script manually: `node sync-products-to-meilisearch.js`

### Search not working
- Verify MeiliSearch is accessible at the configured URL
- Check browser console for API errors
- Ensure products are synced to the index

## Production Considerations

For production deployment:

1. **Set up authentication**:
   ```env
   MEILISEARCH_API_KEY=your-secure-api-key
   ```

2. **Configure persistent storage**:
   ```bash
   docker run -d \
     --name meilisearch \
     -p 7700:7700 \
     -e MEILI_MASTER_KEY=your-secure-master-key \
     -v /path/to/meili_data:/meili_data \
     getmeili/meilisearch:v1.5
   ```

3. **Set up monitoring** and health checks
4. **Configure backups** for the MeiliSearch data directory

## API Endpoints

The following endpoints are available for product search:

- `GET /api/super-admin/product-search/search` - Search products
- `GET /api/super-admin/product-search/suggestions` - Get search suggestions
- `GET /api/super-admin/product-search/facets` - Get faceted search data
- `POST /api/super-admin/product-search/sync` - Sync products to MeiliSearch
- `GET /api/super-admin/product-search/stats` - Get index statistics
- `DELETE /api/super-admin/product-search/clear` - Clear the search index

## Support

For more information about MeiliSearch:
- Documentation: https://docs.meilisearch.com/
- GitHub: https://github.com/meilisearch/meilisearch
- Discord: https://discord.gg/meilisearch
