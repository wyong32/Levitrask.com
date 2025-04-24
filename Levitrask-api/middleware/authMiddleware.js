import jwt from 'jsonwebtoken';
// REMOVED: dotenv is not needed in Vercel environment
// import dotenv from 'dotenv';

// REMOVED: dotenv.config() call
// dotenv.config(); 

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in the environment variables.");
  process.exit(1); // Stop the application if JWT_SECRET is missing
}

export const authenticateAdmin = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] authenticateAdmin middleware triggered for path: ${req.path}`);
  
  // Get token from header
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Extract token from "Bearer <token>"
    token = authHeader.split(' ')[1];
    console.log(`[${new Date().toISOString()}] Token found in Authorization header.`);
  } else {
      console.warn(`[${new Date().toISOString()}] No Bearer token found in Authorization header.`);
      return res.status(401).json({ message: 'Authorization denied. No token provided.' });
  }

  if (!token) {
    console.warn(`[${new Date().toISOString()}] Authorization denied. Token extracted was empty.`);
    return res.status(401).json({ message: 'Authorization denied. No token provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user payload to request object
    req.user = decoded.user; // Assuming the payload has a 'user' object as defined in auth.js
    console.log(`[${new Date().toISOString()}] Token verified successfully for user ID: ${req.user?.id}`);
    next(); // Proceed to the next middleware or route handler

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Token verification failed:`, err.message);
    if (err.name === 'TokenExpiredError') {
         return res.status(401).json({ message: 'Authorization denied. Token has expired.' });
    } else if (err.name === 'JsonWebTokenError') {
         return res.status(401).json({ message: 'Authorization denied. Invalid token.' });
    } else {
        return res.status(403).json({ message: 'Authorization denied. Token is not valid.' });
    }   
  }
}; 