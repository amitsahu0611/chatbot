const { Op } = require('sequelize');
const { User, Company } = require('../../models');
const logger = require('../../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * Get all users with pagination and filtering
 */
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      companyId = '',
      status = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add role filter
    if (role) {
      whereClause.role = role;
    }

    // Add company filter
    if (companyId) {
      whereClause.companyId = companyId;
    }

    // Add status filter
    if (status) {
      whereClause.isActive = status === 'active';
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name'],
        required: false
      }],
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'companyId', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: count,
          limit: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name']
      }],
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'companyId', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

/**
 * Create a new user
 */
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, companyId } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, password, role'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role
    const validRoles = ['super_admin', 'company_admin', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: super_admin, company_admin, user'
      });
    }

    // Validate company exists if companyId is provided
    if (companyId) {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password, // This will be hashed by the model hook
      role,
      companyId: companyId || null,
      isActive: true
    });

    // Fetch user with company data
    const createdUser = await User.findByPk(user.id, {
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name']
      }],
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'companyId', 'isActive', 'createdAt']
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: createdUser
    });

  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, companyId, isActive, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['super_admin', 'company_admin', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be one of: super_admin, company_admin, user'
        });
      }
    }

    // Validate company exists if companyId is provided
    if (companyId) {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        });
      }
    }

    // Check if email already exists for other users
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: id }
        }
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Another user with this email already exists'
        });
      }
    }

    // Update user
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (companyId !== undefined) updateData.companyId = companyId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.password = password; // Will be hashed by model hook

    await user.update(updateData);

    // Fetch updated user with company data
    const updatedUser = await User.findByPk(id, {
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name']
      }],
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'companyId', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt']
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super admin users
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin users'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

/**
 * Get user statistics
 */
const getUserStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      superAdmins,
      companyAdmins,
      regularUsers,
      recentUsers
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { isActive: false } }),
      User.count({ where: { role: 'super_admin' } }),
      User.count({ where: { role: 'company_admin' } }),
      User.count({ where: { role: 'user' } }),
      User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        superAdmins,
        companyAdmins,
        regularUsers,
        recentUsers
      }
    });

  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
};
