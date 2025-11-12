const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { 
  createItem, 
  getItemsByLocation, 
  getItemById,
  getMyItems, 
  updateItem, 
  deleteItem
} = require('../controllers/itemsController');

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get items by location
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Search radius in meters (default 5000)
 *     responses:
 *       200:
 *         description: List of items near the location
 */
router.get('/', getItemsByLocation);

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - expiry
 *               - price
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *               expiry:
 *                 type: string
 *                 format: date
 *               price:
 *                 type: number
 *               isFree:
 *                 type: boolean
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Item created successfully
 */
router.post('/', authMiddleware, upload.array('images', 5), createItem);

/**
 * @swagger
 * /items/my-items:
 *   get:
 *     summary: Get all items for the logged-in user
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's items
 */
router.get('/my-items', authMiddleware, getMyItems);

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get a single item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         description: Item not found
 */
router.get('/:id', getItemById);

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Update an item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               expiry:
 *                 type: string
 *                 format: date
 *               price:
 *                 type: number
 *               isFree:
 *                 type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Item updated successfully
 */
router.put('/:id', authMiddleware, upload.array('images', 5), updateItem);

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete an item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item deleted successfully
 */
router.delete('/:id', authMiddleware, deleteItem);

module.exports = router;
