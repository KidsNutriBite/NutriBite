import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.model.js';
import env from '../config/env.js';

export const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user no longer exists');
            }

            if (req.user.status === 'Inactive' || req.user.status === 'Suspended') {
                res.status(403);
                throw new Error(`Account is ${req.user.status.toLowerCase()}. Please contact an administrator.`);
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(res.statusCode === 200 ? 401 : res.statusCode);
            throw new Error(error.message || 'Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});
