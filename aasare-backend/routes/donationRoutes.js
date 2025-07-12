// routes/donationRoutes.js
const express = require('express');
const router = express.Router();
const {
  createDonation,
  getUnfulfilled,
  getFulfilled,
  fulfillDonation,
  getMyRequests,
  deleteDonation,
  getAvailableForOrganization,
  claimDonation
} = require('../controllers/donationController');

const protect = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// POST: Create donation request (Organization only)
router.post('/', protect, createDonation);

// ✅ GET: Get unfulfilled donation requests (with protection so userId is available)
router.get('/unfulfilled', protect, getUnfulfilled);

// GET: Get fulfilled donation requests
router.get('/fulfilled', getFulfilled);

// ✅ PUT: Fulfill a donation request (Donor only, with protection)
router.put('/:id/fulfill', protect, fulfillDonation);

// ✅ GET: Get donation requests made by the logged-in organization
router.get('/mine', protect, getMyRequests);

// DELETE: Delete a donation request (Admin only)
router.delete('/:id', protect, deleteDonation);

// ✅ GET: Get unclaimed extra food donations for organization
router.get('/available', protect, getAvailableForOrganization);

// ✅ PUT: Claim an unclaimed extra food donation (Organization only)
router.put('/:id/claim', protect, authorizeRoles('Organization'), claimDonation);

module.exports = router;
