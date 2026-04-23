
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Check if SMTP is configured
const isSmtpConfigured = () => {
    return (
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );
};

let transporter;

if (isSmtpConfigured()) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
} else {
    console.warn("⚠️ SMTP not configured. Email service will log to console.");
}

export const sendEmail = async (to, subject, html) => {
    const isConfigured = isSmtpConfigured();

    try {
        if (!isConfigured) {
            console.log("==========================================");
            console.log("📨 EMAIL SIMULATION (SMTP Not Configured)");
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body Snippet: ${html.substring(0, 100)}...`);
            console.log("==========================================");
            // Return success to simulate working email in dev
            return { success: true, message: 'Simulated email sent' };
        }

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL || '"NutriKid" <no-reply@nutrikid.com>',
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Error sending email: ", error.message);
        // Return success: false but do NOT throw to avoid crashing auth flow
        return { success: false, error: error.message };
    }
};
