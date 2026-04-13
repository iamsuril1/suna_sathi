const Contact = require("../models/Contact");

/* SUBMIT CONTACT FORM */
exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create contact submission
    const contact = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: "new",
      userId: req.user?.id || null, // Optional: link to user if authenticated
    });

    // TODO: Send email notification to admin
    // await sendEmailToAdmin(contact);

    res.status(201).json({ 
      message: "Message sent successfully! We'll get back to you soon.",
      contactId: contact._id 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: "Failed to send message. Please try again later." });
  }
};

/* GET ALL CONTACTS (ADMIN ONLY) */
exports.getAllContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && ['new', 'read', 'replied', 'archived'].includes(status)) {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
};

/* UPDATE CONTACT STATUS (ADMIN ONLY) */
exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('userId', 'name email');

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({ message: "Status updated successfully", contact });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({ message: "Failed to update status" });
  }
};

/* DELETE CONTACT (ADMIN ONLY) */
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: "Failed to delete contact" });
  }
};

/* GET CONTACT STATS (ADMIN ONLY) */
exports.getContactStats = async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Contact.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Contact.countDocuments({ createdAt: { $gte: today } });

    const statusCounts = {
      new: 0,
      read: 0,
      replied: 0,
      archived: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    res.json({
      total,
      today: todayCount,
      byStatus: statusCounts
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};