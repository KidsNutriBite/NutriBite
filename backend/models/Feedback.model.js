import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['Bug', 'Suggestion', 'Other'],
            required: true,
            default: 'Bug'
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            minlength: [10, 'Message must be at least 10 characters long'],
            maxlength: [500, 'Message cannot exceed 500 characters']
        },
        email: {
            type: String,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true,
    }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
