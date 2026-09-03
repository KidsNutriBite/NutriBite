import LoginAudit from '../models/LoginAudit.model.js';

/**
 * Log an audit event to the database safely (non-blocking)
 */
export const logAuditEvent = async ({
    userId = null,
    email,
    name = '',
    role = 'unknown',
    action,
    status = 'SUCCESS',
    ipAddress = '',
    userAgent = '',
    details = '',
    req = null,
}) => {
    try {
        const ip = ipAddress || (req ? (req.ip || req.headers['x-forwarded-for'] || '') : '');
        const ua = userAgent || (req ? req.headers['user-agent'] || '' : '');

        await LoginAudit.create({
            userId,
            email: email ? email.toLowerCase().trim() : 'anonymous',
            name,
            role,
            action,
            status,
            ipAddress: ip,
            userAgent: ua,
            details,
        });
    } catch (err) {
        // Silently log error without breaking main transaction flow
        console.error('[AuditLogger] Error logging audit event:', err.message);
    }
};

export default logAuditEvent;
