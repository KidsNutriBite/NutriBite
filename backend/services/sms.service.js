import axios from 'axios';
import env from '../config/env.js';

/**
 * Sends an SMS message using the configured SMS provider.
 * Supports 'twilio', 'msg91', 'fast2sms', and 'console'.
 * 
 * @param {string} to - The recipient's phone number.
 * @param {string} message - The body of the message.
 * @returns {Promise<{success: boolean, sid?: string, data?: any, error?: string}>}
 */
export const sendSMS = async (to, message) => {
    const provider = env.SMS_PROVIDER;

    if (!to) {
        console.warn("⚠️ No phone number provided for SMS.");
        return { success: false, error: 'No phone number provided' };
    }

    try {
        if (provider === 'console') {
            console.log("==========================================");
            console.log("📨 SMS SIMULATION (Provider: console)");
            console.log(`To: ${to}`);
            console.log(`Message: ${message}`);
            console.log("==========================================");
            return { success: true, message: 'Simulated SMS sent' };
        }

        if (provider === 'twilio') {
            if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
                throw new Error('Twilio configuration is incomplete (sid, token, or phone number missing)');
            }
            const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
            const data = new URLSearchParams({
                To: to,
                From: env.TWILIO_PHONE_NUMBER,
                Body: message
            });

            const response = await axios.post(
                `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
                data.toString(),
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            return { success: true, sid: response.data.sid };
        }

        if (provider === 'msg91') {
            if (!env.MSG91_AUTH_KEY || !env.MSG91_TEMPLATE_ID) {
                throw new Error('MSG91 configuration is incomplete (auth key or template id missing)');
            }
            const response = await axios.post(
                'https://control.msg91.com/api/v5/flow/',
                {
                    flow_id: env.MSG91_TEMPLATE_ID,
                    recipients: [
                        {
                            mobiles: to,
                            message: message // Custom variables can be passed based on template design
                        }
                    ]
                },
                {
                    headers: {
                        'authkey': env.MSG91_AUTH_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return { success: true, data: response.data };
        }

        if (provider === 'fast2sms') {
            if (!env.FAST2SMS_API_KEY) {
                throw new Error('Fast2SMS configuration is incomplete (api key missing)');
            }
            const response = await axios.post(
                'https://www.fast2sms.com/dev/bulkV2',
                {
                    message: message,
                    language: 'english',
                    route: 'q',
                    numbers: to
                },
                {
                    headers: {
                        'authorization': env.FAST2SMS_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return { success: true, data: response.data };
        }

        throw new Error(`Unsupported SMS provider: ${provider}`);
    } catch (error) {
        console.error(`❌ Error sending SMS via ${provider}: `, error.response?.data || error.message);
        return { success: false, error: error.message };
    }
};
