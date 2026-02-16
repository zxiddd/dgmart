const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @param {'body' | 'query' | 'params'} source - Request property to validate
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            console.log('VALIDATION ERROR:', JSON.stringify(error.details, null, 2));
            console.log('BAD PAYLOAD:', JSON.stringify(req[source], null, 2));
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message.replace(/"/g, ''),
                })),
            });
        }

        req[source] = value;
        next();
    };
};

module.exports = { validate };
