const adminService = require('../services/adminService');

const getOverview = async (req, res, next) => {
  try {
    const targetDate = req.query.date;
    const data = await adminService.getOverview(targetDate);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
};
