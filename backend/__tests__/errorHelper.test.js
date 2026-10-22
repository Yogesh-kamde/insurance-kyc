const { extractChaincodeError } = require('../utils/errorHelper')

describe('extractChaincodeError', () => {
    test('extracts the real chaincode message from err.details, stripping the response-code prefix', () => {
        const err = {
            message: '10 ABORTED: failed to endorse transaction, see attached details for more info',
            details: [
                { message: 'chaincode response 500, claim amount exceeds policy coverage' }
            ]
        }
        expect(extractChaincodeError(err)).toBe('claim amount exceeds policy coverage')
    })

    test('returns the raw detail message when it has no recognizable prefix', () => {
        const err = {
            message: 'generic gateway error',
            details: [{ message: 'some other peer-level failure' }]
        }
        expect(extractChaincodeError(err)).toBe('some other peer-level failure')
    })

    test('falls back to err.message when details is missing', () => {
        const err = { message: 'duplicate key error' }
        expect(extractChaincodeError(err)).toBe('duplicate key error')
    })

    test('falls back to err.message when details is an empty array', () => {
        const err = { message: 'some mongo error', details: [] }
        expect(extractChaincodeError(err)).toBe('some mongo error')
    })

    test('returns a default string when there is no message at all', () => {
        expect(extractChaincodeError({})).toBe('An unexpected error occurred')
    })
})