const {verify} = require('jsonwebtoken');


const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    try {
        const validToken = verify(token, 'your_secret_key');
        req.user = validToken;

        if(validToken){
          return next();
        } 
        
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = verifyToken;