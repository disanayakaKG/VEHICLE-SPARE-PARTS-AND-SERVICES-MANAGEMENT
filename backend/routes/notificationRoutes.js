const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all notifications (Admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const notifications = await Notification.find({ type: 'inventory' }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a notification (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification) {
      await Notification.findByIdAndDelete(req.params.id);
      res.json({ message: 'Notification deleted' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
