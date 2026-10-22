// @hyperledger/fabric-gateway wraps endorsement/submission failures in a
// generic error (e.g. "10 ABORTED: failed to endorse transaction, see
// attached details for more info") and puts the real per-peer chaincode
// error in err.details[]. This pulls the actual reason out so the API
// caller sees "claim amount exceeds policy coverage" instead of "ABORTED".
function extractChaincodeError(err) {
    if (err && Array.isArray(err.details) && err.details.length > 0) {
        const detailMessage = err.details[0].message || ''
        const match = detailMessage.match(/chaincode response \d+,\s*(.*)/i)
        if (match) {
            return match[1]
        }
        if (detailMessage) {
            return detailMessage
        }
    }
    return err.message || 'An unexpected error occurred'
}

module.exports = { extractChaincodeError }