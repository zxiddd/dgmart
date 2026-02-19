/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Joi validation error
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            })),
        });
    }

    // Firebase auth error
    if (err.code && err.code.startsWith('auth/')) {
        return res.status(401).json({
            success: false,
            message: getFirebaseAuthMessage(err.code),
        });
    }

    // Multer file upload error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File is too large. Maximum size is 5MB.',
        });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            success: false,
            message: 'Unexpected file field.',
        });
    }

    // Default server error
    const statusCode = err.statusCode || 500;
    const message = err.statusCode ? err.message : 'Internal server error';

    res.status(statusCode).json({
        success: false,
        message,
        error: err.message,
        stack: err.stack, // Temp: always show stack for debugging
    });
};

/**
 * Not found handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
};

/**
 * Create custom API error
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}

function getFirebaseAuthMessage(code) {
    const messages = {
        'auth/id-token-expired': 'Session expired. Please login again.',
        'auth/id-token-revoked': 'Session revoked. Please login again.',
        'auth/invalid-id-token': 'Invalid authentication token.',
        'auth/user-not-found': 'User not found.',
        'auth/user-disabled': 'This account has been disabled.',
    };
    return messages[code] || 'Authentication error.';
}

module.exports = { errorHandler, notFoundHandler, ApiError };
