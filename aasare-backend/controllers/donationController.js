const Donation = require('../models/Donation');

// Create donation request (for both Organizations and Donors)
const createDonation = async (req, res) => {
  const { itemType, quantity, neededBy } = req.body;

  try {
    const donationData = {
      itemType,
      quantity,
      neededBy,
    };

    if (req.user.role === 'Organization' || req.user.role === 'orphanage') {
      donationData.orphanage = req.user._id;
    } else if (req.user.role === 'Donor' || req.user.role === 'donor') {
      donationData.donor = req.user._id;
    } else {
      return res.status(403).json({ error: 'Only Donors or Organizations can create donations' });
    }

    const donation = new Donation(donationData);
    const saved = await donation.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get all unfulfilled requests (excluding donor's own offers)
const getUnfulfilled = async (req, res) => {
  try {
    const donations = await Donation.find({ fulfilled: false })
      .populate('orphanage', 'name address')
      .populate('donor', 'name email');

    let filtered = donations;
    if (req.user.role === 'Donor' || req.user.role === 'donor') {
      filtered = donations.filter(d => d.donor?._id.toString() !== req.user._id.toString());
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all fulfilled requests
const getFulfilled = async (req, res) => {
  try {
    const fulfilled = await Donation.find({ fulfilled: true })
      .populate('orphanage', 'name address')
      .populate('donor', 'name email');
    res.json(fulfilled);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Mark donation as fulfilled (Only for Donors, and not their own)
const fulfillDonation = async (req, res) => {
  if (req.user.role !== 'Donor' && req.user.role !== 'donor') {
    return res.status(403).json({ error: 'Only donors can fulfill donation requests' });
  }

  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ error: 'Donation not found' });
    if (donation.fulfilled) return res.status(400).json({ error: 'Already fulfilled' });

    // ✅ Prevent donor from fulfilling their own request
    if (donation.donor && donation.donor.toString() === req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot fulfill your own donation' });
    }

    donation.fulfilled = true;
    await donation.save();
    res.json({ message: 'Donation fulfilled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get donations created by logged-in organization
const getMyRequests = async (req, res) => {
  try {
    const donations = await Donation.find({ orphanage: req.user._id });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all relevant donations for organization (own + donor offers)
const getAvailableForOrganization = async (req, res) => {
  try {
    if (req.user.role !== 'Organization' && req.user.role !== 'orphanage') {
      return res.status(403).json({ error: 'Only organizations can view this data' });
    }

    const donations = await Donation.find({
      $or: [
        { orphanage: req.user._id },         // Organization's own requests
        { donor: { $exists: true }, orphanage: null } // ✅ Unclaimed donor-offered food
      ]
    })
      .populate('orphanage', 'name address')
      .populate('donor', 'name email');

    res.json(donations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Claim a donation (Only by organizations)
const claimDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.fulfilled) {
      return res.status(400).json({ error: 'Donation is already fulfilled' });
    }

    if (donation.orphanage) {
      return res.status(400).json({ error: 'Donation already claimed by another organization' });
    }

    // Attach the current organization as the claimer
    donation.orphanage = req.user._id;
    await donation.save();

    res.status(200).json({ message: 'Donation claimed successfully' });
  } catch (error) {
    console.error('Claim Donation Error:', error);
    res.status(500).json({ error: 'Server error while claiming donation' });
  }
};

// Delete donation (Admin only)
const deleteDonation = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createDonation,
  getUnfulfilled,
  getFulfilled,
  fulfillDonation,
  getMyRequests,
  deleteDonation,
  getAvailableForOrganization,
  claimDonation
};
