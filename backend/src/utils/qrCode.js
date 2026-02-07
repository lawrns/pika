import QRCode from 'qrcode';

export async function generateQRCode(data, options = {}) {
  const defaults = {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  };

  const qrOptions = { ...defaults, ...options };

  try {
    const qrDataUrl = await QRCode.toDataURL(data, qrOptions);
    return qrDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

export async function generatePaymentQRCode(paymentLink, baseUrl) {
  const paymentUrl = `${baseUrl}/pay/${paymentLink.reference_code}`;

  const qrData = {
    type: 'payment',
    reference: paymentLink.reference_code,
    amount: paymentLink.amount,
    currency: paymentLink.currency,
    url: paymentUrl
  };

  return await generateQRCode(JSON.stringify(qrData));
}

export function parsePaymentQRCode(qrData) {
  try {
    const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;

    if (data.type === 'payment' && data.reference) {
      return {
        referenceCode: data.reference,
        amount: data.amount,
        currency: data.currency,
        url: data.url
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function generateSPEIQRCode(clabe, amount, reference) {
  const speiData = {
    type: 'SPEI',
    clabe,
    amount,
    reference,
    timestamp: new Date().toISOString()
  };

  return await generateQRCode(JSON.stringify(speiData), {
    errorCorrectionLevel: 'M'
  });
}
