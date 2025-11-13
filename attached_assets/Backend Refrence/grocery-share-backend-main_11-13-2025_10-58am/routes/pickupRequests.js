const express = require('express');
const router = express.Router();
const { 
  createPickupRequest,
  getPickupRequests,
  getPickupRequestById,
  acceptPickupRequest,
  declinePickupRequest,
  confirmPickupCompletion,
  cancelPickupRequest
} = require('../controllers/pickupRequestController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Create a new pickup request
// POST /api/v1/pickup-requests
router.post('/', createPickupRequest);

// Get all pickup requests (filtered by query params)
// GET /api/v1/pickup-requests?role=seller&status=pending
router.get('/', getPickupRequests);

// Get a specific pickup request by ID
// GET /api/v1/pickup-requests/:requestId
router.get('/:requestId', getPickupRequestById);

// Accept a pickup request (seller only)
// PATCH /api/v1/pickup-requests/:requestId/accept
router.patch('/:requestId/accept', acceptPickupRequest);

// Decline a pickup request (seller only)
// PATCH /api/v1/pickup-requests/:requestId/decline', declinePickupRequest);

// Confirm pickup completion (buyer or seller)
// POST /api/v1/pickup-requests/:requestId/confirm
router.post('/:requestId/confirm', confirmPickupCompletion);

// Cancel a pickup request (requester only)
// DELETE /api/v1/pickup-requests/:requestId
router.delete('/:requestId', cancelPickupRequest);

module.exports = router;
