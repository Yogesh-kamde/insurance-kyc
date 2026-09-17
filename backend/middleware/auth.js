const jwt = require('jsonwebtoken')

const auth = (allowedRoles) => {
    return (req, res, next) => {
        // Check cookie first, then Authorization header as fallback
        const token = req.cookies.token || req.headers['authorization']?.split(' ')[1]
        
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' })
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = decoded

            if (allowedRoles && !allowedRoles.includes(decoded.role)) {
                return res.status(403).json({ success: false, error: 'Access denied — insufficient role' })
            }

            next()
        } catch (err) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' })
        }
    }
}

module.exports = auth