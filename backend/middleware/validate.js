const { body, param, validationResult } = require('express-validator')

// Middleware to check validation results
const checkErrors = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array().map(e => e.msg) 
        })
    }
    next()
}

// Verify KYC validation
const validateKYC = [
    body('customerID').notEmpty().withMessage('Customer ID is required'),
    body('decision').isIn(['APPROVED', 'REJECTED']).withMessage('Decision must be APPROVED or REJECTED'),
    checkErrors
]

// Issue Policy validation
const validatePolicy = [
    body('policyType').notEmpty().withMessage('Policy type is required'),
    body('customerID').notEmpty().withMessage('Customer ID is required'),
    body('coverageAmount').notEmpty().isNumeric().withMessage('Coverage amount must be a number'),
    checkErrors
]

// File Claim validation
const validateClaim = [
    body('customerID').notEmpty().withMessage('Customer ID is required'),
    body('policyId').notEmpty().withMessage('Policy ID is required'),
    body('reason').notEmpty().withMessage('Reason is required'),
    body('claimAmount').notEmpty().isNumeric().withMessage('Claim amount must be a number'),
    checkErrors
]

// Process Payout validation
const validatePayout = [
    body('claimID').notEmpty().withMessage('Claim ID is required'),
    body('payoutAmount').notEmpty().isNumeric().withMessage('Payout amount must be a number'),
    checkErrors
]
// Assess Claim validation
const validateAssess = [
    body('claimID').notEmpty().withMessage('Claim ID is required'),
    body('decision').isIn(['ASSESSED', 'REJECTED']).withMessage('Decision must be ASSESSED or REJECTED'),
    checkErrors
]

module.exports = { validateKYC, validatePolicy, validateClaim, validatePayout, validateAssess }