const { Product } = require('../../models');
const { Op } = require('sequelize');
const meilisearchService = require('../../services/meilisearchService');

const productController = {
  // Get all products with search functionality (Database-driven)
  getAllProducts: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const { 
        search, 
        page = 1, 
        limit = 20, // Default to 20 for consistency with search API
        category, 
        brand, 
        gender,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;
      
      const offset = (page - 1) * limit;

      // Build dynamic search conditions
      const whereConditions = {};

      if (search) {
        whereConditions[Op.or] = [
          { product_name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { brand: { [Op.like]: `%${search}%` } },
          { category: { [Op.like]: `%${search}%` } }
        ];
      }

      if (category) {
        whereConditions.category = { [Op.like]: `%${category}%` };
      }

      if (brand) {
        whereConditions.brand = { [Op.like]: `%${brand}%` };
      }

      if (gender) {
        whereConditions.gender = gender;
      }

      // Validate sort fields
      const allowedSortFields = ['product_name', 'price', 'brand', 'category', 'created_at', 'stock_quantity'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      const { count, rows: products } = await Product.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[validSortBy, validSortOrder]],
        attributes: [
          'id', 'product_name', 'description', 'price', 'brand', 
          'category', 'gender', 'stock_quantity', 'image_url', 'created_at'
        ]
      });

      // Calculate pagination info
      const totalPages = Math.ceil(count / limit);
      const currentPage = parseInt(page);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            currentPage,
            totalPages,
            totalItems: count,
            itemsPerPage: parseInt(limit),
            hasMore: currentPage < totalPages,
            hasPrevious: currentPage > 1,
            nextPage: currentPage < totalPages ? currentPage + 1 : null,
            previousPage: currentPage > 1 ? currentPage - 1 : null
          },
          filters: {
            search: search || null,
            category: category || null,
            brand: brand || null,
            gender: gender || null,
            sortBy: validSortBy,
            sortOrder: validSortOrder
          }
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      });
    }
  },

  // Get single product by ID
  getProductById: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const { id } = req.params;
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error.message
      });
    }
  },

  // Create new product
  createProduct: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const {
        product_name,
        description,
        price,
        brand,
        category,
        gender,
        stock_quantity,
        image_url
      } = req.body;

      // Validate required fields
      if (!product_name) {
        return res.status(400).json({
          success: false,
          message: 'Product name is required'
        });
      }

      const product = await Product.create({
        product_name,
        description,
        price,
        brand,
        category,
        gender,
        stock_quantity: stock_quantity || 0,
        image_url
      });

      // Sync to MeiliSearch
      try {
        await meilisearchService.addProduct(product);
      } catch (meilisearchError) {
        console.error('Error syncing product to MeiliSearch:', meilisearchError);
        // Don't fail the request if MeiliSearch sync fails
      }

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message
      });
    }
  },

  // Update product
  updateProduct: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const { id } = req.params;
      const {
        product_name,
        description,
        price,
        brand,
        category,
        gender,
        stock_quantity,
        image_url
      } = req.body;

      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await product.update({
        product_name,
        description,
        price,
        brand,
        category,
        gender,
        stock_quantity,
        image_url
      });

      // Sync to MeiliSearch
      try {
        await meilisearchService.updateProduct(product);
      } catch (meilisearchError) {
        console.error('Error syncing updated product to MeiliSearch:', meilisearchError);
        // Don't fail the request if MeiliSearch sync fails
      }

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message
      });
    }
  },

  // Delete product
  deleteProduct: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const { id } = req.params;
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const productId = product.id;
      await product.destroy();

      // Remove from MeiliSearch
      try {
        await meilisearchService.deleteProduct(productId);
      } catch (meilisearchError) {
        console.error('Error removing product from MeiliSearch:', meilisearchError);
        // Don't fail the request if MeiliSearch sync fails
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message
      });
    }
  },

  // Get product categories
  getCategories: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const categories = await Product.findAll({
        attributes: ['category'],
        where: {
          category: { [Op.not]: null }
        },
        group: ['category'],
        raw: true
      });

      const categoryList = categories.map(item => item.category).filter(Boolean);

      res.json({
        success: true,
        data: categoryList
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error.message
      });
    }
  },

  // Get product brands
  getBrands: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const brands = await Product.findAll({
        attributes: ['brand'],
        where: {
          brand: { [Op.not]: null }
        },
        group: ['brand'],
        raw: true
      });

      const brandList = brands.map(item => item.brand).filter(Boolean);

      res.json({
        success: true,
        data: brandList
      });
    } catch (error) {
      console.error('Error fetching brands:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch brands',
        error: error.message
      });
    }
  },

  // Get product statistics (Dynamic data from database)
  getProductStats: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      // Get total product count
      const totalProducts = await Product.count();

      // Get products by category
      const categoryStats = await Product.findAll({
        attributes: [
          'category',
          [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
        ],
        group: ['category'],
        raw: true
      });

      // Get products by brand
      const brandStats = await Product.findAll({
        attributes: [
          'brand',
          [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
        ],
        group: ['brand'],
        order: [[Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true
      });

      // Get products by gender
      const genderStats = await Product.findAll({
        attributes: [
          'gender',
          [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
        ],
        group: ['gender'],
        raw: true
      });

      // Get price range statistics
      const priceStats = await Product.findAll({
        attributes: [
          [Product.sequelize.fn('MIN', Product.sequelize.col('price')), 'minPrice'],
          [Product.sequelize.fn('MAX', Product.sequelize.col('price')), 'maxPrice'],
          [Product.sequelize.fn('AVG', Product.sequelize.col('price')), 'avgPrice']
        ],
        raw: true
      });

      // Get low stock products (stock < 20)
      const lowStockCount = await Product.count({
        where: {
          stock_quantity: {
            [Op.lt]: 20
          }
        }
      });

      // Get out of stock products
      const outOfStockCount = await Product.count({
        where: {
          stock_quantity: 0
        }
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalProducts,
            lowStockProducts: lowStockCount,
            outOfStockProducts: outOfStockCount,
            inStockProducts: totalProducts - outOfStockCount
          },
          categories: categoryStats,
          brands: brandStats,
          genderDistribution: genderStats,
          priceRange: {
            min: parseFloat(priceStats[0]?.minPrice || 0),
            max: parseFloat(priceStats[0]?.maxPrice || 0),
            average: parseFloat(priceStats[0]?.avgPrice || 0)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching product statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product statistics',
        error: error.message
      });
    }
  },

  // Get dynamic filter options (from actual database data)
  getFilterOptions: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      // Get unique categories
      const categories = await Product.findAll({
        attributes: ['category'],
        group: ['category'],
        where: {
          category: {
            [Op.ne]: null
          }
        },
        raw: true
      });

      // Get unique brands
      const brands = await Product.findAll({
        attributes: ['brand'],
        group: ['brand'],
        where: {
          brand: {
            [Op.ne]: null
          }
        },
        order: [['brand', 'ASC']],
        raw: true
      });

      // Get unique genders
      const genders = await Product.findAll({
        attributes: ['gender'],
        group: ['gender'],
        where: {
          gender: {
            [Op.ne]: null
          }
        },
        raw: true
      });

      // Get price ranges
      const priceRanges = [
        { label: 'Under $25', min: 0, max: 25 },
        { label: '$25 - $50', min: 25, max: 50 },
        { label: '$50 - $100', min: 50, max: 100 },
        { label: '$100 - $200', min: 100, max: 200 },
        { label: '$200 - $500', min: 200, max: 500 },
        { label: 'Over $500', min: 500, max: null }
      ];

      res.json({
        success: true,
        data: {
          categories: categories.map(c => c.category).filter(Boolean),
          brands: brands.map(b => b.brand).filter(Boolean),
          genders: genders.map(g => g.gender).filter(Boolean),
          priceRanges
        }
      });

    } catch (error) {
      console.error('Error fetching filter options:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch filter options',
        error: error.message
      });
    }
  }
};

module.exports = productController;
