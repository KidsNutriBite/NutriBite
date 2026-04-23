import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true // Efficient querying
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false // Could be system generated
        },
        type: {
            type: String,
            enum: ['doctor_message', 'health_alert', 'appointment_update', 'system'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
