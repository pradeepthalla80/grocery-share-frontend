const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createRequest,
  getNearbyRequests,
  getMyRequests,
  getRequestById,
  respondToRequest,
  updateRequestStatus,
  deleteRequest
} = require('../controllers/itemRequestController');

router.post('/', auth, createRequest);
router.get('/nearby', auth, getNearbyRequests);
router.get('/my-requests', auth, getMyRequests);
router.get('/:requestId', auth, getRequestById);
router.post('/:requestId/respond', auth, respondToRequest);
router.put('/:requestId/status', auth, updateRequestStatus);
router.delete('/:requestId', auth, deleteRequest);

module.exports = router;
