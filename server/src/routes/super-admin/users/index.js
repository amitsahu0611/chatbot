const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/super-admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Super Admin - Users]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: []
  });
});

/**
 * @swagger
 * /api/super-admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Super Admin - Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               companyId:
 *                 type: string
 */
router.post('/', (req, res) => {
  const { name, email, role, companyId } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      id: Date.now(),
      name,
      email,
      role,
      companyId,
      createdAt: new Date().toISOString()
    }
  });
});

module.exports = router;
