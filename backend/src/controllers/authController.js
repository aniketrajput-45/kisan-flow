const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { name, phone, password } = req.body;
    const data = await authService.register({ name, phone, password });
    res.status(201).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const data = await authService.login({ phone, password });
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

module.exports = {
  register,
  login,
  getMe,
};
