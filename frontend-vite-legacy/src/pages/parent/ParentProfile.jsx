import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

const ParentProfile = () => {
    const { user, login } = useAuth();
    // Actually useAuth might doesn't expose a way to update user in state without relogin. 
    // We might need to reload or just fetch local state.
    // Ideally AuthContext should expose `updateUser`.

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        title: 'Mr',
        address: {
            city: '',
            state: '',
            country: ''
        }
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/parent/me');
            setProfile(data.data);
            setFormData({
                name: data.data.name || '',
                phone: data.data.phone || data.data.parentProfile?.phoneNumber || '',
                title: data.data.title || 'Mr',
                address: {
                    city: data.data.address?.city || data.data.parentProfile?.city || '',
                    state: data.data.address?.state || '',
                    country: data.data.address?.country || ''
                }
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            setSelectedFile(file);
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const triggerFileSelect = () => {
        if (isEditing) {
            fileInputRef.current.click();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Updating profile...');

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('phone', formData.phone);
            submitData.append('title', formData.title);
            submitData.append('address', JSON.stringify(formData.address));

            if (selectedFile) {
                submitData.append('profileImage', selectedFile);
            }

            const { data } = await api.patch('/parent/update', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Profile updated successfully', { id: toastId });
            setProfile(data.data.user);
            setPreviewUrl(null);
            setSelectedFile(null);
            setIsEditing(false);
            // Optionally update global auth user if context supports it
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Update failed', { id: toastId });
        }
    };

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                {/* Header / Avatar Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 p-8 flex flex-col md:flex-row items-center gap-6 border-b border-gray-100 dark:border-slate-700">

                    {/* Avatar Container */}
                    <div
                        className={`relative group ${isEditing ? 'cursor-pointer' : ''}`}
                        onClick={triggerFileSelect}
                        title={isEditing ? "Click to change photo" : ""}
                    >
                        <img
                            src={previewUrl || profile?.profileImage || 'https://avatar.iran.liara.run/public'}
                            alt="Profile"
                            className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white object-cover"
                        />

                        {/* Camera Overlay on Hover (Only in Edit Mode) */}
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white">photo_camera</span>
                            </div>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            {profile?.title} {profile?.name}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">{profile?.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                            {profile?.role}
                        </span>
                    </div>
                </div>

                {/* Details Section */}
                <div className="p-8">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <select
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Mr">Mr</option>
                                    <option value="Ms">Ms</option>
                                    <option value="Mrs">Mrs</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 border-b pb-2">Address</h3>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                <input
                                    type="text"
                                    name="address.city"
                                    value={formData.address.city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                                <input
                                    type="text"
                                    name="address.state"
                                    value={formData.address.state}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                                <input
                                    type="text"
                                    name="address.country"
                                    value={formData.address.country}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="md:col-span-2 flex gap-3 justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setPreviewUrl(null);
                                        setSelectedFile(null);
                                        setFormData({ // Reset form
                                            name: profile.name,
                                            phone: profile.phone || '',
                                            title: profile.title || 'Mr',
                                            address: {
                                                city: profile.address?.city || '',
                                                state: profile.address?.state || '',
                                                country: profile.address?.country || ''
                                            }
                                        });
                                    }}
                                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Phone</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{profile?.phone || 'Not set'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Location</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                    {[profile?.address?.city, profile?.address?.state, profile?.address?.country].filter(Boolean).join(', ') || 'Not set'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{new Date(profile?.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentProfile;
