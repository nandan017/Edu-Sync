const { sendSuccess, sendError } = require('../utils/response');

// POST /api/v1/gate/verify
exports.verifyGate = async (req, res) => {
  try {
    const { role, accessKey } = req.body;

    if (!role || !accessKey) {
      return sendError(res, 'Role and access key are required', 400);
    }

    let expectedKey;
    if (role === 'faculty') {
      expectedKey = process.env.FACULTY_ACCESS_KEY;
    } else if (role === 'hod') {
      expectedKey = process.env.HOD_ACCESS_KEY;
    } else {
      return sendError(res, 'Invalid role', 400);
    }

    if (!expectedKey) {
      return sendError(res, 'Access key not configured. Contact administrator.', 500);
    }

    if (accessKey !== expectedKey) {
      return sendError(res, 'Invalid access key. Contact your administrator for the correct key.', 401);
    }

    sendSuccess(res, { message: 'Access granted', role });
  } catch (err) {
    sendError(res, err.message);
  }
};
