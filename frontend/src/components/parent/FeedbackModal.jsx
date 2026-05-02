"use client";
import { useState } from 'react';
import Modal from '../common/Modal';
import axios from 'axios';
import api from '../../api/axios'; // Or standard axios if api doesn't have it

const FeedbackModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        type: 'Bug',
        message: '',
        email: ''
    });
    const [status, setStatus] = useState({ loading: false, error: '', success: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.message.length < 10) {
            setStatus({ loading: false, error: 'Message must be at least 10 characters long.', success: '' });
            return;
        }
        if (formData.message.length > 500) {
            setStatus({ loading: false, error: 'Message cannot exceed 500 characters.', success: '' });
            return;
        }

        try {
            setStatus({ loading: true, error: '', success: '' });
            await api.post('/feedback', formData);
            setStatus({ loading: false, error: '', success: 'Thank you! Your feedback has been submitted.' });
            setTimeout(() => {
                setFormData({ type: 'Bug', message: '', email: '' });
                setStatus({ loading: false, error: '', success: '' });
                onClose();
            }, 2000);
        } catch (error) {
            setStatus({ 
                loading: false, 
                error: error.response?.data?.message || 'Failed to submit feedback. Please try again.', 
                success: '' 
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send Feedback">
            <form onSubmit={handleSubmit} className="space-y-4">
                {status.error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {status.error}
                    </div>
                )}
                {status.success && (
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm font-bold border border-green-100 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        {status.success}
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Feedback Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors font-medium text-sm"
                    >
                        <option value="Bug">Report a Bug 🐛</option>
                        <option value="Suggestion">Feature Suggestion 💡</option>
                        <option value="Other">Other 📝</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                    <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="What's on your mind? (10 - 500 characters)"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors font-medium text-sm h-32 resize-none"
                        required
                        minLength={10}
                        maxLength={500}
                    />
                    <div className="text-right text-xs text-slate-400 mt-1 font-semibold">
                        {formData.message.length}/500
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email (Optional)</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="For follow-up questions"
                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors font-medium text-sm"
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={status.loading || status.success}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm flex items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {status.loading ? (
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-sm">send</span>
                        )}
                        {status.loading ? 'Sending...' : 'Send Feedback'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default FeedbackModal;
