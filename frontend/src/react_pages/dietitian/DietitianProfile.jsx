"use client";
import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

const DietitianProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        title: 'Ms',
        address: {
            city: '',
            state: '',
            country: ''
        },
        dietitianProfile: {
            specialization: '',
            experienceYears: 0,
            registrationId: ''
        }
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/dietitian/me');
            setProfile(data.data);
            setFormData({
                name: data.data.name || '',
                phone: data.data.phone || '',
                title: data.data.title || 'Ms',
                address: {
                    city: data.data.address?.city || '',
                    state: data.data.address?.state || '',
                    country: data.data.address?.country || ''
                },
                dietitianProfile: {
                    specialization: data.data.dietitianProfile?.specialization || '',
                    experienceYears: data.data.dietitianProfile?.experienceYears || 0,
                    registrationId: data.data.dietitianProfile?.registrationId || ''
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
            submitData.append('dietitianProfile', JSON.stringify(formData.dietitianProfile));

            if (selectedFile) {
                submitData.append('profileImage', selectedFile);
            }

            const { data } = await api.patch('/dietitian/update', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Profile updated successfully', { id: toastId });
            setProfile(data.data.user);
            setPreviewUrl(null);
            setSelectedFile(null);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Update failed', { id: toastId });
        }
    };

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dietitian Profile</h1>
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

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                    {/* Header profile info */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div 
                            className={`relative w-28 h-28 rounded-full border-4 border-slate-100 dark:border-slate-800 overflow-hidden ${isEditing ? 'cursor-pointer group' : ''}`}
                            onClick={triggerFileSelect}
                        >
                            <img 
                                src={previewUrl || profile?.profileImage || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cccccc"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'} 
                                alt={profile?.name} 
                                className="w-full h-full object-cover"
                            />
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
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
                        <div className="text-center sm:text-left">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                {profile?.title}. {profile?.name}
                            </h2>
                            <p className="text-sm text-slate-500">{profile?.email}</p>
                            <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                {profile?.role?.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">Basic Information</h3>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title</label>
                                <select
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
                                >
                                    <option value="Ms">Ms</option>
                                    <option value="Mr">Mr</option>
                                    <option value="Mrs">Mrs</option>
                                    <option value="Dr">Dr</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
                                />
                            </div>
                        </div>

                        {/* Professional Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">Professional Details</h3>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Specialization</label>
                                <input
                                    type="text"
                                    name="dietitianProfile.specialization"
                                    value={formData.dietitianProfile.specialization}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Experience (Years)</label>
                                <input
                                    type="number"
                                    name="dietitianProfile.experienceYears"
                                    value={formData.dietitianProfile.experienceYears}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Registration ID</label>
                                <input
                                    type="text"
                                    name="dietitianProfile.registrationId"
                                    value={formData.dietitianProfile.registrationId}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">Address Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">City</label>
                                <input
                                    type="text"
                                    name="address.city"
                                    value={formData.address.city}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">State</label>
                                <input
                                    type="text"
                                    name="address.state"
                                    value={formData.address.state}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Country</label>
                                <input
                                    type="text"
                                    name="address.country"
                                    value={formData.address.country}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary disabled:opacity-60"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    {isEditing && (
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setPreviewUrl(null);
                                    setSelectedFile(null);
                                    // Reset formData
                                    setFormData({
                                        name: profile?.name || '',
                                        phone: profile?.phone || '',
                                        title: profile?.title || 'Ms',
                                        address: {
                                            city: profile?.address?.city || '',
                                            state: profile?.address?.state || '',
                                            country: profile?.address?.country || ''
                                        },
                                        dietitianProfile: {
                                            specialization: profile?.dietitianProfile?.specialization || '',
                                            experienceYears: profile?.dietitianProfile?.experienceYears || 0,
                                            registrationId: profile?.dietitianProfile?.registrationId || ''
                                        }
                                    });
                                }}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-100 dark:shadow-none"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default DietitianProfile;
