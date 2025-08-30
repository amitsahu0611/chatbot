const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../../../controllers/super-admin/usersController');

/**
 * @swagger
 * /api/super-admin/users:
 *   get:
 *     summary: Get all users with pagination and filtering
 *     tags: [Super Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Filter by company
 *     responses:
 *       200:
 *         description: List of users with pagination
 */
router.get('/', auth, getAllUsers);

/**
 * @swagger
 * /api/super-admin/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Super Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 */
router.get('/stats', auth, getUserStats);

/**
 * @swagger
 * /api/super-admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Super Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', auth, getUserById);

/**
 * @swagger
 * /api/super-admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Super Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [super_admin, company_admin, user]
 *               companyId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/', auth, createUser);

/**
 * @swagger
 * /api/super-admin/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Super Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [super_admin, company_admin, user]
 *               companyId:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 */
router.put('/:id', auth, updateUser);

/**
 * @swagger
 * /api/super-admin/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Super Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Cannot delete super admin
 */
router.delete('/:id', auth, deleteUser);

module.exports = router;
