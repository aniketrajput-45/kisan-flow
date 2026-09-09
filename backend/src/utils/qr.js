const QRCode = require('qrcode');

/**
 * Generates a stable QR identifier string and base64 QR code image payload
 * Format: KF-BKG-{randomHex}-{timestamp}
 */
const generateQrData = async (identifier) => {
  const qrString = `KF-BKG-${identifier}`;
  let base64Image = null;
  try {
    base64Image = await Promise.race([
      QRCode.toDataURL(qrString),
      new Promise((_, reject) => setTimeout(() => reject(new Error('QR Timeout')), 500))
    ]);
  } catch (err) {
    // Fallback QR data URL representation
    base64Image = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><text>${qrString}</text></svg>`;
  }
  return {
    qrString,
    base64Image,
  };
};

module.exports = {
  generateQrData,
};
