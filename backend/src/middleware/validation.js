import Joi from 'joi';

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
    fullName: Joi.string().min(2).max(255).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createPaymentLink: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().valid('MXN', 'USD').default('MXN'),
    description: Joi.string().max(500).optional(),
    expiresIn: Joi.number().integer().min(1).max(168).default(24)
  }),

  paymentRequest: Joi.object({
    referenceCode: Joi.string().required(),
    cardholderName: Joi.string().required(),
    cardNumber: Joi.string().pattern(/^\d{16}$/).required(),
    expiryDate: Joi.string().pattern(/^(0[1-9]|1[0-2])\/\d{2}$/).required(),
    cvv: Joi.string().pattern(/^\d{3,4}$/).required()
  }),

  transfer: Joi.object({
    recipientEmail: Joi.string().email().required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(500).optional()
  })
};

export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    req.validated = value;
    next();
  };
}
