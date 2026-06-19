"use client";

import { useState, useEffect } from 'react';
import { updateProfile } from '../../api/profile.api';
import toast from 'react-hot-toast';

const likesOptions = ["Milk", "Fruits", "Vegetables", "Pasta", "Rice", "Chicken", "Eggs", "Paneer", "Dosa", "Idli", "Oats", "Bread", "Yogurt", "Soup", "Potatoes"];
const dislikesOptions = ["Mushrooms", "Broccoli", "Bitter Gourd", "Eggplant", "Spinach", "Seafood", "Onions", "Garlic", "Spicy Foods", "Beans", "Peas", "Cauliflower"];

const ProfileInfoAndReports = ({ profile, onUpdate }) => {
    // Basic Info Editing State
    const [isEditingBasic, setIsEditingBasic] = useState(false);
    const [basicForm, setBasicForm] = useState({
        name: profile.name || '',
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
        gender: profile.gender || 'male',
        bloodGroup: profile.bloodGroup || 'O+',
        height: profile.height || '',
        weight: profile.weight || '',
        waistCircumference: profile.waistCircumference || '',
        sportsActivityLevel: profile.sportsActivityLevel || 'Moderately Active',
        prematureBirth: {
            isPremature: profile.prematureBirth?.isPremature || false,
            weeksPremature: profile.prematureBirth?.weeksPremature || 0
        },
        location: {
            country: profile.location?.country || 'India',
            state: profile.location?.state || '',
            city: profile.location?.city || '',
            address: profile.location?.address || ''
        }
    });

    const [newProfileImage, setNewProfileImage] = useState(null);
    const [newProfileImagePreview, setNewProfileImagePreview] = useState(null);

    // Health Info Editing State
    const [isEditingHealth, setIsEditingHealth] = useState(false);
    const [healthForm, setHealthForm] = useState({
        healthConditions: profile.healthConditions || [],
        otherCondition: profile.otherCondition || '',
        familyHistory: {
            siblingConditions: {
                hasCondition: profile.familyHistory?.siblingConditions?.hasCondition || false,
                description: profile.familyHistory?.siblingConditions?.description || ''
            },
            motherConditions: {
                hasCondition: profile.familyHistory?.motherConditions?.hasCondition || false,
                description: profile.familyHistory?.motherConditions?.description || ''
            },
            fatherConditions: {
                hasCondition: profile.familyHistory?.fatherConditions?.hasCondition || false,
                description: profile.familyHistory?.fatherConditions?.description || ''
            },
            nutritionConcerns: profile.familyHistory?.nutritionConcerns || ''
        }
    });

    // Preferences State
    const [isEditingPrefs, setIsEditingPrefs] = useState(false);
    const [prefsForm, setPrefsForm] = useState({
        favoriteFoods: profile.preferences?.favoriteFoods || '',
        dislikedFoods: profile.preferences?.dislikedFoods || '',
        favoriteFruits: profile.preferences?.favoriteFruits || '',
        favoriteVegetables: profile.preferences?.favoriteVegetables || '',
        favoriteSnacks: profile.preferences?.favoriteSnacks || '',
        waterIntake: profile.preferences?.waterIntake || 1000,
        activityLevel: profile.preferences?.activityLevel || 'moderate',
        sleepDuration: profile.preferences?.sleepDuration || 8,
        screenTime: profile.preferences?.screenTime || 1,
        eatingHabits: profile.preferences?.eatingHabits || 'average',
        sleepQuality: profile.preferences?.sleepQuality || 'Average'
    });

    const [selectedLikes, setSelectedLikes] = useState([]);
    const [customLikedText, setCustomLikedText] = useState('');
    const [selectedDislikes, setSelectedDislikes] = useState([]);
    const [customDislikedText, setCustomDislikedText] = useState('');

    // Notes State
    const [notes, setNotes] = useState(profile.parentNotes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    useEffect(() => {
        if (!profile) return;
        
        setNotes(profile.parentNotes || '');
        
        if (!isEditingBasic) {
            setBasicForm({
                name: profile.name || '',
                dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
                gender: profile.gender || 'male',
                bloodGroup: profile.bloodGroup || 'O+',
                height: profile.height || '',
                weight: profile.weight || '',
                waistCircumference: profile.waistCircumference || '',
                sportsActivityLevel: profile.sportsActivityLevel || 'Moderately Active',
                prematureBirth: {
                    isPremature: profile.prematureBirth?.isPremature || false,
                    weeksPremature: profile.prematureBirth?.weeksPremature || 0
                },
                location: {
                    country: profile.location?.country || 'India',
                    state: profile.location?.state || '',
                    city: profile.location?.city || '',
                    address: profile.location?.address || ''
                }
            });
        }
        
        if (!isEditingHealth) {
            setHealthForm({
                healthConditions: profile.healthConditions || [],
                otherCondition: profile.otherCondition || '',
                familyHistory: {
                    siblingConditions: {
                        hasCondition: profile.familyHistory?.siblingConditions?.hasCondition || false,
                        description: profile.familyHistory?.siblingConditions?.description || ''
                    },
                    motherConditions: {
                        hasCondition: profile.familyHistory?.motherConditions?.hasCondition || false,
                        description: profile.familyHistory?.motherConditions?.description || ''
                    },
                    fatherConditions: {
                        hasCondition: profile.familyHistory?.fatherConditions?.hasCondition || false,
                        description: profile.familyHistory?.fatherConditions?.description || ''
                    },
                    nutritionConcerns: profile.familyHistory?.nutritionConcerns || ''
                }
            });
        }
        
        if (!isEditingPrefs) {
            setPrefsForm({
                favoriteFoods: profile.preferences?.favoriteFoods || '',
                dislikedFoods: profile.preferences?.dislikedFoods || '',
                favoriteFruits: profile.preferences?.favoriteFruits || '',
                favoriteVegetables: profile.preferences?.favoriteVegetables || '',
                favoriteSnacks: profile.preferences?.favoriteSnacks || '',
                waterIntake: profile.preferences?.waterIntake || 1000,
                activityLevel: profile.preferences?.activityLevel || 'moderate',
                sleepDuration: profile.preferences?.sleepDuration || 8,
                screenTime: profile.preferences?.screenTime || 1,
                eatingHabits: profile.preferences?.eatingHabits || 'average',
                sleepQuality: profile.preferences?.sleepQuality || 'Average'
            });

            const likes = profile.preferences?.favoriteFoods
                ? profile.preferences.favoriteFoods.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            setSelectedLikes(likes.filter(item => likesOptions.includes(item)));
            const customLikes = likes.filter(item => !likesOptions.includes(item)).join(', ');
            setCustomLikedText(customLikes);

            const dislikes = profile.preferences?.dislikedFoods
                ? profile.preferences.dislikedFoods.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            setSelectedDislikes(dislikes.filter(item => dislikesOptions.includes(item)));
            const customDislikes = dislikes.filter(item => !dislikesOptions.includes(item)).join(', ');
            setCustomDislikedText(customDislikes);
        }
    }, [profile, isEditingBasic, isEditingHealth, isEditingPrefs]);

    // Reports Vault State
    const [isAddingReport, setIsAddingReport] = useState(false);
    const [editingReportIdx, setEditingReportIdx] = useState(null);
    const [tempReport, setTempReport] = useState({
        reportName: '',
        reportDate: '',
        hospitalName: '',
        doctorName: '',
        comments: '',
        status: 'Not Reviewed',
        file: null
    });

    // Options mapping
    const availableConditions = [
        'Asthma', 'Diabetes', 'Obesity', 'Underweight', 'Anemia', 'Food Allergies',
        'Skin Conditions', 'Dental Problems', 'Digestive Issues', 'Frequent Fever',
        'Vision Problems', 'Hearing Problems'
    ];

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Profile picture must be under 5MB");
            return;
        }
        setNewProfileImage(file);
        setNewProfileImagePreview(URL.createObjectURL(file));
    };

    const handleNotesSave = async () => {
        setIsSavingNotes(true);
        try {
            const formData = new FormData();
            formData.append('data', JSON.stringify({ parentNotes: notes }));
            await updateProfile(profile._id, formData);
            toast.success('Notes updated successfully');
            onUpdate();
        } catch (error) {
            toast.error(error.message || 'Failed to update notes');
        } finally {
            setIsSavingNotes(false);
        }
    };

    const saveBasicInfo = async () => {
        // Validation checks
        if (!basicForm.name.trim()) return toast.error("Name is required");
        if (!basicForm.dob) return toast.error("Date of Birth is required");
        if (new Date(basicForm.dob) > new Date()) return toast.error("Future date of birth is not allowed");
        if (!basicForm.bloodGroup) return toast.error("Blood group is required");

        const h = Number(basicForm.height);
        const w = Number(basicForm.weight);
        const wc = Number(basicForm.waistCircumference);
        if (!basicForm.height || h < 50 || h > 220) return toast.error("Height must be between 50 and 220 cm");
        if (!basicForm.weight || w < 1 || w > 200) return toast.error("Weight must be between 1 and 200 kg");
        if (!basicForm.waistCircumference || wc < 20 || wc > 200) return toast.error("Waist Circumference must be between 20 and 200 cm");

        if (!basicForm.location.country.trim()) return toast.error("Country is required");
        if (!basicForm.location.state.trim()) return toast.error("State is required");
        if (!basicForm.location.city.trim()) return toast.error("City is required");
        if (!basicForm.location.address.trim()) return toast.error("Address is required");

        try {
            const data = new FormData();
            data.append('data', JSON.stringify(basicForm));
            if (newProfileImage) {
                data.append('profileImage', newProfileImage);
            }

            await updateProfile(profile._id, data);
            toast.success("Profile basic information updated");
            setIsEditingBasic(false);
            setNewProfileImage(null);
            setNewProfileImagePreview(null);
            onUpdate();
        } catch (error) {
            toast.error(error.message || "Failed to save profile changes");
        }
    };

    const saveHealthDetails = async () => {
        try {
            const data = new FormData();
            data.append('data', JSON.stringify(healthForm));
            await updateProfile(profile._id, data);
            toast.success("Health and hereditary history updated");
            setIsEditingHealth(false);
            onUpdate();
        } catch (error) {
            toast.error(error.message || "Failed to update health info");
        }
    };

    const savePreferences = async () => {
        const mergedLikes = [...selectedLikes, customLikedText.trim()].filter(Boolean).join(', ');
        const mergedDislikes = [...selectedDislikes, customDislikedText.trim()].filter(Boolean).join(', ');
        try {
            const data = new FormData();
            data.append('data', JSON.stringify({ 
                preferences: {
                    ...prefsForm,
                    favoriteFoods: mergedLikes,
                    dislikedFoods: mergedDislikes
                } 
            }));
            await updateProfile(profile._id, data);
            toast.success("Nutrition & lifestyle preferences updated");
            setIsEditingPrefs(false);
            onUpdate();
        } catch (error) {
            toast.error(error.message || "Failed to update preferences");
        }
    };

    // Report operations
    const handleReportDelete = async (reportId) => {
        if (!window.confirm("Are you sure you want to delete this medical report?")) return;
        try {
            const updatedReports = profile.medicalReports.filter(r => r._id !== reportId);
            const data = new FormData();
            data.append('data', JSON.stringify({ medicalReports: updatedReports }));
            await updateProfile(profile._id, data);
            toast.success("Medical report deleted");
            onUpdate();
        } catch (error) {
            toast.error(error.message || "Failed to delete report");
        }
    };

    const handleReportStatusToggle = async (reportId, currentStatus) => {
        try {
            const updatedReports = profile.medicalReports.map(r => {
                if (r._id === reportId) {
                    return { ...r, status: currentStatus === 'Reviewed' ? 'Not Reviewed' : 'Reviewed' };
                }
                return r;
            });
            const data = new FormData();
            data.append('data', JSON.stringify({ medicalReports: updatedReports }));
            await updateProfile(profile._id, data);
            toast.success("Report review status updated");
            onUpdate();
        } catch (error) {
            toast.error(error.message || "Failed to update report status");
        }
    };

    const saveNewReport = async () => {
        if (!tempReport.reportName.trim()) return toast.error("Report name is required");
        if (!tempReport.reportDate) return toast.error("Report date is required");
        if (!tempReport.hospitalName.trim()) return toast.error("Hospital/Lab name is required");
        if (!tempReport.doctorName.trim()) return toast.error("Doctor name is required");
        if (!tempReport.file) return toast.error("Please attach the report file document");

        try {
            const data = new FormData();
            // Append existing reports
            const currentReports = profile.medicalReports.map(r => ({
                _id: r._id,
                reportName: r.reportName,
                reportDate: r.reportDate,
                hospitalName: r.hospitalName,
                doctorName: r.doctorName,
                comments: r.comments,
                attachment: r.attachment,
                status: r.status
            }));

            const fileIndex = currentReports.length;
            const newMeta = {
                reportName: tempReport.reportName,
                reportDate: tempReport.reportDate,
                hospitalName: tempReport.hospitalName,
                doctorName: tempReport.doctorName,
                comments: tempReport.comments,
                status: tempReport.status,
                fileIndex
            };

            data.append('data', JSON.stringify({ medicalReports: [...currentReports, newMeta] }));
            data.append(`medicalReportFile_${fileIndex}`, tempReport.file);

            await updateProfile(profile._id, data);
            toast.success("Medical report uploaded successfully!");
            setIsAddingReport(false);
            setTempReport({
                reportName: '',
                reportDate: '',
                hospitalName: '',
                doctorName: '',
                comments: '',
                status: 'Not Reviewed',
                file: null
            });
            onUpdate();
        } catch (error) {
            toast.error(error.message || "Failed to upload report");
        }
    };

    const saveEditReport = async () => {
        if (!tempReport.reportName.trim()) return toast.error("Report name is required");
        if (!tempReport.reportDate) return toast.error("Report date is required");
        if (!tempReport.hospitalName.trim()) return toast.error("Hospital/Lab name is required");
        if (!tempReport.doctorName.trim()) return toast.error("Doctor name is required");

        try {
            const data = new FormData();
            const currentReports = profile.medicalReports.map((r, idx) => {
                if (idx === editingReportIdx) {
                    return {
                        _id: r._id,
                        reportName: tempReport.reportName,
                        reportDate: tempReport.reportDate,
                        hospitalName: tempReport.hospitalName,
                        doctorName: tempReport.doctorName,
                        comments: tempReport.comments,
                        attachment: r.attachment, // keep old attachment url unless new file
                        status: tempReport.status,
                        fileIndex: idx
                    };
                }
                return {
                    _id: r._id,
                    reportName: r.reportName,
                    reportDate: r.reportDate,
                    hospitalName: r.hospitalName,
                    doctorName: r.doctorName,
                    comments: r.comments,
                    attachment: r.attachment,
                    status: r.status
                };
            });

            data.append('data', JSON.stringify({ medicalReports: currentReports }));
            if (tempReport.file) {
                data.append(`medicalReportFile_${editingReportIdx}`, tempReport.file);
            }

            await updateProfile(profile._id, data);
            toast.success("Medical report updated successfully!");
            setEditingReportIdx(null);
            setTempReport({
                reportName: '',
                reportDate: '',
                hospitalName: '',
                doctorName: '',
                comments: '',
                status: 'Not Reviewed',
                file: null
            });
            onUpdate();
        } catch (error) {
            toast.error(error.message || "Failed to update report");
        }
    };

    const triggerEditReportMode = (idx) => {
        const report = profile.medicalReports[idx];
        setEditingReportIdx(idx);
        setTempReport({
            reportName: report.reportName,
            reportDate: report.reportDate ? new Date(report.reportDate).toISOString().split('T')[0] : '',
            hospitalName: report.hospitalName,
            doctorName: report.doctorName,
            comments: report.comments || '',
            status: report.status || 'Not Reviewed',
            file: null
        });
    };

    return (
        <div className="space-y-8">
            {/* Notes & Summary widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Notes Text Area */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">Parent Notes & Observations</h3>
                        <p className="text-gray-400 text-xs font-bold mb-4 uppercase">PERSONAL REFLECTIONS & AD HOC SYMPTOMS</p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Jot down dietary exceptions, recent behavioral mood shifts, or home symptom diaries..."
                            className="w-full h-32 p-3 text-sm border rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none resize-none font-medium text-gray-700"
                        />
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={handleNotesSave}
                            disabled={isSavingNotes || notes === profile.parentNotes}
                            className="px-6 py-2.5 bg-primary text-white font-extrabold text-sm rounded-xl shadow hover:bg-blue-600 transition disabled:opacity-50"
                        >
                            {isSavingNotes ? 'Saving...' : 'Save Notes'}
                        </button>
                    </div>
                </div>

                {/* Audit Information Logs */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">Audit logs</h3>
                        <p className="text-gray-400 text-xs font-bold mb-4 uppercase">PROFILE CHANGE AUDIT TRAIL</p>
                        <div className="space-y-3 max-h-36 overflow-y-auto pr-1">
                            {!profile.changeHistory || profile.changeHistory.length === 0 ? (
                                <p className="text-xs text-gray-400 font-bold italic">No updates audited yet.</p>
                            ) : (
                                profile.changeHistory.slice().reverse().map((h, i) => (
                                    <div key={i} className="text-xs border-l-2 border-primary/40 pl-3 py-0.5">
                                        <p className="text-gray-500 font-bold">
                                            {new Date(h.updatedAt).toLocaleString()}
                                        </p>
                                        <p className="text-gray-700 font-semibold leading-relaxed">
                                            Changed: <span className="text-indigo-600 font-bold">{h.fieldsChanged?.join(', ')}</span>
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 1: Basic Info & Physical Stats */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Basic Information & Physical Metrics</h3>
                        <p className="text-gray-400 text-xs font-bold uppercase">PHYSICAL STATS & GEOGRAPHY DETAILS</p>
                    </div>
                    {!isEditingBasic ? (
                        <button
                            onClick={() => {
                                setBasicForm({
                                    name: profile.name || '',
                                    dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
                                    gender: profile.gender || 'male',
                                    bloodGroup: profile.bloodGroup || 'O+',
                                    height: profile.height || '',
                                    weight: profile.weight || '',
                                    waistCircumference: profile.waistCircumference || '',
                                    sportsActivityLevel: profile.sportsActivityLevel || 'Moderately Active',
                                    prematureBirth: {
                                        isPremature: profile.prematureBirth?.isPremature || false,
                                        weeksPremature: profile.prematureBirth?.weeksPremature || 0
                                    },
                                    location: {
                                        country: profile.location?.country || 'India',
                                        state: profile.location?.state || '',
                                        city: profile.location?.city || '',
                                        address: profile.location?.address || ''
                                    }
                                });
                                setIsEditingBasic(true);
                            }}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl text-sm transition"
                        >
                            Edit Section
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIsEditingBasic(false);
                                    setNewProfileImage(null);
                                    setNewProfileImagePreview(null);
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveBasicInfo}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-blue-600 transition shadow-sm"
                            >
                                Save Info
                            </button>
                        </div>
                    )}
                </div>

                {!isEditingBasic ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Profile Image & Avatar */}
                        <div className="flex items-center gap-4 col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-2xl">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border shadow-sm overflow-hidden shrink-0">
                                {profile.profileImage ? (
                                    <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl">
                                        {profile.avatar === 'lion' && '🦁'}
                                        {profile.avatar === 'bear' && '🐻'}
                                        {profile.avatar === 'rabbit' && '🐰'}
                                        {profile.avatar === 'fox' && '🦊'}
                                        {profile.avatar === 'cat' && '🐱'}
                                        {profile.avatar === 'dog' && '🐶'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Child Name</p>
                                <p className="font-extrabold text-gray-800 text-lg leading-tight">{profile.name}</p>
                                <p className="text-xs text-gray-500 font-medium">DOB: {new Date(profile.dob).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Stats Widgets */}
                        <div className="bg-gray-50 p-4 rounded-2xl flex flex-col justify-center">
                            <p className="text-xs text-gray-400 font-bold uppercase">Biological Stats</p>
                            <p className="font-extrabold text-gray-800 text-sm mt-1">Gender: <span className="capitalize">{profile.gender}</span></p>
                            <p className="font-extrabold text-gray-800 text-sm">Blood Group: {profile.bloodGroup}</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-2xl flex flex-col justify-center">
                            <p className="text-xs text-gray-400 font-bold uppercase">Physical Bounds</p>
                            <p className="font-extrabold text-gray-800 text-sm mt-1">Height: {profile.height} cm</p>
                            <p className="font-extrabold text-gray-800 text-sm">Weight: {profile.weight} kg</p>
                            <p className="font-extrabold text-gray-800 text-sm">Waist Circumference: {profile.waistCircumference} cm</p>
                        </div>

                        {/* Activity & Birth Info */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-gray-50 p-4 rounded-2xl flex flex-col justify-center">
                            <p className="text-xs text-gray-400 font-bold uppercase">Sports & Birth Info</p>
                            <p className="font-extrabold text-gray-800 text-sm mt-1">Sports Activity Level: <span className="text-indigo-600 font-bold">{profile.sportsActivityLevel || 'Moderately Active'}</span></p>
                            <p className="font-extrabold text-gray-800 text-sm mt-1">
                                Born Prematurely: <span className={profile.prematureBirth?.isPremature ? 'text-amber-600 font-bold' : 'text-gray-700'}>
                                    {profile.prematureBirth?.isPremature ? `Yes (${profile.prematureBirth.weeksPremature || 0} weeks)` : 'No'}
                                </span>
                            </p>
                        </div>

                        {/* Location Details */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-gray-50 p-4 rounded-2xl">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Registered Address</p>
                            <p className="font-bold text-gray-700 text-sm">
                                {profile.location?.address}, {profile.location?.city}, {profile.location?.state}, {profile.location?.country}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Edit Basic Fields Form */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Profile image change */}
                            <div className="col-span-1 md:col-span-3 flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border shadow-sm overflow-hidden shrink-0 relative">
                                    {newProfileImagePreview ? (
                                        <img src={newProfileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : profile.profileImage ? (
                                        <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl">🦁</span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-600">Replace Profile Photo</p>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleProfileImageChange}
                                        className="text-xs text-gray-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {newProfileImagePreview && (
                                        <button 
                                            onClick={() => {
                                                setNewProfileImage(null);
                                                setNewProfileImagePreview(null);
                                            }}
                                            className="text-[10px] text-red-600 font-bold block"
                                        >
                                            Remove Selection
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Child's Name</label>
                                <input
                                    type="text"
                                    value={basicForm.name}
                                    onChange={(e) => setBasicForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Date of Birth</label>
                                <input
                                    type="date"
                                    max={new Date().toISOString().split('T')[0]}
                                    value={basicForm.dob}
                                    onChange={(e) => setBasicForm(prev => ({ ...prev, dob: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Gender</label>
                                <select
                                    value={basicForm.gender}
                                    onChange={(e) => setBasicForm(prev => ({ ...prev, gender: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Blood Group</label>
                                <select
                                    value={basicForm.bloodGroup}
                                    onChange={(e) => setBasicForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                >
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Sports Activity Level</label>
                                <select
                                    value={basicForm.sportsActivityLevel}
                                    onChange={(e) => setBasicForm(prev => ({ ...prev, sportsActivityLevel: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="Very Active">Very Active</option>
                                    <option value="Active">Active</option>
                                    <option value="Moderately Active">Moderately Active</option>
                                    <option value="Low Activity">Low Activity</option>
                                    <option value="Sedentary">Sedentary</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Born Prematurely?</label>
                                <div className="flex gap-2">
                                    {['No', 'Yes'].map((opt, i) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setBasicForm(prev => ({
                                                ...prev,
                                                prematureBirth: {
                                                    ...prev.prematureBirth,
                                                    isPremature: i === 1,
                                                    weeksPremature: i === 0 ? 0 : prev.prematureBirth.weeksPremature
                                                }
                                            }))}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${basicForm.prematureBirth.isPremature === (i === 1) ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {basicForm.prematureBirth.isPremature && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600">Weeks Premature</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={basicForm.prematureBirth.weeksPremature || ''}
                                        onChange={(e) => setBasicForm(prev => ({
                                            ...prev,
                                            prematureBirth: {
                                                ...prev.prematureBirth,
                                                weeksPremature: Number(e.target.value) || 0
                                            }
                                        }))}
                                        className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                        placeholder="Number of weeks"
                                    />
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Height (cm)</label>
                                <input
                                    type="number"
                                    value={basicForm.height}
                                    onChange={(e) => setBasicForm(prev => ({ ...prev, height: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="50 - 220"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={basicForm.weight}
                                    onChange={(e) => setBasicForm(prev => ({ ...prev, weight: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="1 - 200"
                                />
                            </div>

                            {/* Waist with Tooltip */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <label className="text-xs font-bold text-gray-600">Waist Circumference (cm)</label>
                                    <div className="group relative cursor-pointer">
                                        <span className="bg-gray-100 text-gray-400 border rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">i</span>
                                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs p-3 rounded-lg w-64 z-50 shadow-lg leading-normal font-normal">
                                            Waist circumference helps assess body fat distribution and can indicate potential health risks related to obesity.
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="number"
                                    value={basicForm.waistCircumference}
                                    onChange={(e) => setBasicForm(prev => ({ ...prev, waistCircumference: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="20 - 200"
                                />
                            </div>

                            {/* Location nested inputs */}
                            <div className="col-span-1 md:col-span-3 border-t pt-4 mt-2">
                                <p className="text-xs font-black text-gray-400 uppercase mb-3">Address & Location</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-600">Country</label>
                                        <input
                                            type="text"
                                            value={basicForm.location.country}
                                            onChange={(e) => setBasicForm(prev => ({
                                                ...prev,
                                                location: { ...prev.location, country: e.target.value }
                                            }))}
                                            className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-600">State</label>
                                        <input
                                            type="text"
                                            value={basicForm.location.state}
                                            onChange={(e) => setBasicForm(prev => ({
                                                ...prev,
                                                location: { ...prev.location, state: e.target.value }
                                            }))}
                                            className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-600">City / Town</label>
                                        <input
                                            type="text"
                                            value={basicForm.location.city}
                                            onChange={(e) => setBasicForm(prev => ({
                                                ...prev,
                                                location: { ...prev.location, city: e.target.value }
                                            }))}
                                            className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-3">
                                        <label className="text-xs font-bold text-gray-600">Street Address</label>
                                        <input
                                            type="text"
                                            value={basicForm.location.address}
                                            onChange={(e) => setBasicForm(prev => ({
                                                ...prev,
                                                location: { ...prev.location, address: e.target.value }
                                            }))}
                                            className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Section 2: Health Details & Family History */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Clinical Background & Family History</h3>
                        <p className="text-gray-400 text-xs font-bold uppercase">HEREDITARY RISKS & DIAGNOSED CONDITIONS</p>
                    </div>
                    {!isEditingHealth ? (
                        <button
                            onClick={() => setIsEditingHealth(true)}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl text-sm transition"
                        >
                            Edit Section
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditingHealth(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveHealthDetails}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-blue-600 transition shadow-sm"
                            >
                                Save Details
                            </button>
                        </div>
                    )}
                </div>

                {!isEditingHealth ? (
                    <div className="space-y-6">
                        {/* Diagnosed Conditions list */}
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase mb-2">Diagnosed Health Conditions</p>
                            {profile.healthConditions?.length === 0 && !profile.otherCondition ? (
                                <p className="text-sm font-semibold text-gray-500 italic">No health conditions declared.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {profile.healthConditions?.map(cond => (
                                        <span key={cond} className="px-3 py-1 bg-red-50 text-red-700 text-xs font-extrabold rounded-lg border border-red-100">
                                            {cond}
                                        </span>
                                    ))}
                                    {profile.otherCondition && (
                                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-extrabold rounded-lg border border-gray-200">
                                            Other: {profile.otherCondition}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Genetics */}
                        <div className="border-t pt-4">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Family Hereditary History</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Sibling Conditions</p>
                                    <p className="font-extrabold text-gray-800 mt-1">
                                        {profile.familyHistory?.siblingConditions?.hasCondition ? '⚠️ Yes' : '✅ None'}
                                    </p>
                                    {profile.familyHistory?.siblingConditions?.hasCondition && (
                                        <p className="text-xs text-gray-600 italic mt-1">{profile.familyHistory?.siblingConditions?.description}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Mother Conditions</p>
                                    <p className="font-extrabold text-gray-800 mt-1">
                                        {profile.familyHistory?.motherConditions?.hasCondition ? '⚠️ Yes' : '✅ None'}
                                    </p>
                                    {profile.familyHistory?.motherConditions?.hasCondition && (
                                        <p className="text-xs text-gray-600 italic mt-1">{profile.familyHistory?.motherConditions?.description}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase">Father Conditions</p>
                                    <p className="font-extrabold text-gray-800 mt-1">
                                        {profile.familyHistory?.fatherConditions?.hasCondition ? '⚠️ Yes' : '✅ None'}
                                    </p>
                                    {profile.familyHistory?.fatherConditions?.hasCondition && (
                                        <p className="text-xs text-gray-600 italic mt-1">{profile.familyHistory?.fatherConditions?.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {profile.familyHistory?.nutritionConcerns && (
                            <div className="border-t pt-4">
                                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Family Nutrition & Lifestyle Concerns</p>
                                <p className="text-sm font-semibold text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                    {profile.familyHistory.nutritionConcerns}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Health checkbox selector */}
                        <div>
                            <p className="text-xs font-bold text-gray-600 mb-3">Check Diagnosed Conditions</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {availableConditions.map(cond => {
                                    const checked = healthForm.healthConditions.includes(cond);
                                    return (
                                        <label key={cond} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-xs font-bold transition select-none ${checked ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'}`}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => {
                                                    setHealthForm(prev => {
                                                        const exists = prev.healthConditions.includes(cond);
                                                        return {
                                                            ...prev,
                                                            healthConditions: exists 
                                                                ? prev.healthConditions.filter(c => c !== cond)
                                                                : [...prev.healthConditions, cond]
                                                        };
                                                    });
                                                }}
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            {cond}
                                        </label>
                                    );
                                })}
                            </div>
                            <div className="mt-3 space-y-1">
                                <label className="text-xs font-bold text-gray-600">Other Unlisted Conditions</label>
                                <input
                                    type="text"
                                    value={healthForm.otherCondition}
                                    onChange={(e) => setHealthForm(prev => ({ ...prev, otherCondition: e.target.value }))}
                                    placeholder="Specify separate medical concerns..."
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        {/* Genetics Edit */}
                        <div className="border-t pt-4 space-y-4">
                            <p className="text-xs font-black text-gray-400 uppercase">Family Hereditary History Toggles</p>
                            
                            {/* Siblings */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <span className="text-sm font-bold text-gray-700">Does any sibling have medical conditions?</span>
                                <div className="flex gap-2">
                                    {['No', 'Yes'].map((opt, i) => (
                                        <button
                                            key={opt}
                                            onClick={() => setHealthForm(prev => ({
                                                ...prev,
                                                familyHistory: {
                                                    ...prev.familyHistory,
                                                    siblingConditions: {
                                                        ...prev.familyHistory.siblingConditions,
                                                        hasCondition: i === 1,
                                                        description: i === 0 ? '' : prev.familyHistory.siblingConditions.description
                                                    }
                                                }
                                            }))}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${healthForm.familyHistory.siblingConditions.hasCondition === (i === 1) ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {healthForm.familyHistory.siblingConditions.hasCondition && (
                                    <input
                                        type="text"
                                        placeholder="Describe conditions..."
                                        value={healthForm.familyHistory.siblingConditions.description}
                                        onChange={(e) => setHealthForm(prev => ({
                                            ...prev,
                                            familyHistory: {
                                                ...prev.familyHistory,
                                                siblingConditions: {
                                                    ...prev.familyHistory.siblingConditions,
                                                    description: e.target.value
                                                }
                                            }
                                        }))}
                                        className="p-2 text-xs border rounded-lg outline-none w-full focus:ring-1 focus:ring-primary"
                                    />
                                )}
                            </div>

                            {/* Mother */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-t pt-3">
                                <span className="text-sm font-bold text-gray-700">Does mother have hereditary conditions?</span>
                                <div className="flex gap-2">
                                    {['No', 'Yes'].map((opt, i) => (
                                        <button
                                            key={opt}
                                            onClick={() => setHealthForm(prev => ({
                                                ...prev,
                                                familyHistory: {
                                                    ...prev.familyHistory,
                                                    motherConditions: {
                                                        ...prev.familyHistory.motherConditions,
                                                        hasCondition: i === 1,
                                                        description: i === 0 ? '' : prev.familyHistory.motherConditions.description
                                                    }
                                                }
                                            }))}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${healthForm.familyHistory.motherConditions.hasCondition === (i === 1) ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {healthForm.familyHistory.motherConditions.hasCondition && (
                                    <input
                                        type="text"
                                        placeholder="Describe conditions..."
                                        value={healthForm.familyHistory.motherConditions.description}
                                        onChange={(e) => setHealthForm(prev => ({
                                            ...prev,
                                            familyHistory: {
                                                ...prev.familyHistory,
                                                motherConditions: {
                                                    ...prev.familyHistory.motherConditions,
                                                    description: e.target.value
                                                }
                                            }
                                        }))}
                                        className="p-2 text-xs border rounded-lg outline-none w-full focus:ring-1 focus:ring-primary"
                                    />
                                )}
                            </div>

                            {/* Father */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-t pt-3">
                                <span className="text-sm font-bold text-gray-700">Does father have hereditary conditions?</span>
                                <div className="flex gap-2">
                                    {['No', 'Yes'].map((opt, i) => (
                                        <button
                                            key={opt}
                                            onClick={() => setHealthForm(prev => ({
                                                ...prev,
                                                familyHistory: {
                                                    ...prev.familyHistory,
                                                    fatherConditions: {
                                                        ...prev.familyHistory.fatherConditions,
                                                        hasCondition: i === 1,
                                                        description: i === 0 ? '' : prev.familyHistory.fatherConditions.description
                                                    }
                                                }
                                            }))}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${healthForm.familyHistory.fatherConditions.hasCondition === (i === 1) ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {healthForm.familyHistory.fatherConditions.hasCondition && (
                                    <input
                                        type="text"
                                        placeholder="Describe conditions..."
                                        value={healthForm.familyHistory.fatherConditions.description}
                                        onChange={(e) => setHealthForm(prev => ({
                                            ...prev,
                                            familyHistory: {
                                                ...prev.familyHistory,
                                                fatherConditions: {
                                                    ...prev.familyHistory.fatherConditions,
                                                    description: e.target.value
                                                }
                                            }
                                        }))}
                                        className="p-2 text-xs border rounded-lg outline-none w-full focus:ring-1 focus:ring-primary"
                                    />
                                )}
                            </div>

                            {/* Nutrition concerns */}
                            <div className="space-y-1 border-t pt-3">
                                <label className="text-xs font-bold text-gray-600">Family Nutrition Concerns</label>
                                <textarea
                                    value={healthForm.familyHistory.nutritionConcerns}
                                    onChange={(e) => setHealthForm(prev => ({
                                        ...prev,
                                        familyHistory: {
                                            ...prev.familyHistory,
                                            nutritionConcerns: e.target.value
                                        }
                                    }))}
                                    placeholder="Obesity, Diabetes, Heart Disease, Hypertension, etc."
                                    className="w-full h-20 p-2.5 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-primary font-medium resize-none text-gray-700"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Section 3: Lifestyle & Taste Preferences */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Dietary & Lifestyle Preferences</h3>
                        <p className="text-gray-400 text-xs font-bold uppercase">FOOD TASTES & ROUTINE METRICS</p>
                    </div>
                    {!isEditingPrefs ? (
                        <button
                            onClick={() => {
                                const parsedLikes = profile.preferences?.favoriteFoods ? profile.preferences.favoriteFoods.split(',').map(s => s.trim()) : [];
                                const parsedDislikes = profile.preferences?.dislikedFoods ? profile.preferences.dislikedFoods.split(',').map(s => s.trim()) : [];
                                
                                const matchingLikes = parsedLikes.filter(x => likesOptions.includes(x));
                                const customLikes = parsedLikes.filter(x => !likesOptions.includes(x)).join(', ');

                                const matchingDislikes = parsedDislikes.filter(x => dislikesOptions.includes(x));
                                const customDislikes = parsedDislikes.filter(x => !dislikesOptions.includes(x)).join(', ');

                                setSelectedLikes(matchingLikes);
                                setCustomLikedText(customLikes);
                                setSelectedDislikes(matchingDislikes);
                                setCustomDislikedText(customDislikes);

                                setPrefsForm({
                                    favoriteFoods: profile.preferences?.favoriteFoods || '',
                                    dislikedFoods: profile.preferences?.dislikedFoods || '',
                                    favoriteFruits: profile.preferences?.favoriteFruits || '',
                                    favoriteVegetables: profile.preferences?.favoriteVegetables || '',
                                    favoriteSnacks: profile.preferences?.favoriteSnacks || '',
                                    waterIntake: profile.preferences?.waterIntake || 1000,
                                    activityLevel: profile.preferences?.activityLevel || 'moderate',
                                    sleepDuration: profile.preferences?.sleepDuration || 8,
                                    screenTime: profile.preferences?.screenTime || 1,
                                    eatingHabits: profile.preferences?.eatingHabits || 'average',
                                    sleepQuality: profile.preferences?.sleepQuality || 'Average'
                                });
                                setIsEditingPrefs(true);
                            }}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl text-sm transition"
                        >
                            Edit Section
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditingPrefs(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={savePreferences}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-blue-600 transition shadow-sm"
                            >
                                Save Habits
                            </button>
                        </div>
                    )}
                </div>

                {!isEditingPrefs ? (
                    <div className="space-y-6">
                        {/* Food Tastes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-400 font-bold uppercase">Favorite Foods</p>
                                <p className="text-sm font-extrabold text-gray-800 mt-1">{profile.preferences?.favoriteFoods || '--'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-400 font-bold uppercase">Disliked Foods</p>
                                <p className="text-sm font-extrabold text-gray-800 mt-1">{profile.preferences?.dislikedFoods || '--'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-400 font-bold uppercase">Favorite Fruits & Veggies</p>
                                <p className="text-sm font-extrabold text-gray-800 mt-1">
                                    Fruits: {profile.preferences?.favoriteFruits || '--'} <br/>
                                    Vegetables: {profile.preferences?.favoriteVegetables || '--'}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-400 font-bold uppercase">Favorite Snacks</p>
                                <p className="text-sm font-extrabold text-gray-800 mt-1">{profile.preferences?.favoriteSnacks || '--'}</p>
                            </div>
                        </div>

                        {/* Lifestyle Stats */}
                        <div className="border-t pt-4">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-3">Daily Wellness Targets</p>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <span className="text-2xl mb-1 block">💧</span>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Water Target</p>
                                    <p className="font-extrabold text-gray-800 mt-0.5">{profile.preferences?.waterIntake || 0} ml</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <span className="text-2xl mb-1 block">🏃</span>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Activity Level</p>
                                    <p className="font-extrabold text-gray-800 capitalize mt-0.5">{profile.preferences?.activityLevel || 'moderate'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <span className="text-2xl mb-1 block">😴</span>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Sleep Duration</p>
                                    <p className="font-extrabold text-gray-800 mt-0.5">{profile.preferences?.sleepDuration || 0} hrs</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <span className="text-2xl mb-1 block">🛌</span>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Sleep Quality</p>
                                    <p className="font-extrabold text-gray-800 capitalize mt-0.5">{profile.preferences?.sleepQuality || 'Average'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <span className="text-2xl mb-1 block">📺</span>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Screen Limit</p>
                                    <p className="font-extrabold text-gray-800 mt-0.5">{profile.preferences?.screenTime || 0} hrs</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <span className="text-2xl mb-1 block">🥦</span>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Eating Quality</p>
                                    <p className="font-extrabold text-gray-800 capitalize mt-0.5">{profile.preferences?.eatingHabits || 'average'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Tags selectors */}
                        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border">
                            <label className="text-xs font-bold text-gray-700 block uppercase">Favorite Foods / Food Likes</label>
                            <div className="flex flex-wrap gap-2">
                                {likesOptions.map(tag => {
                                    const active = selectedLikes.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setSelectedLikes(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${active ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs' : 'bg-white hover:bg-gray-50 border-gray-250 text-gray-600'}`}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-gray-600 block">Other Food Likes (Comma separated)</label>
                                <input
                                    type="text"
                                    value={customLikedText}
                                    onChange={(e) => setCustomLikedText(e.target.value)}
                                    placeholder="e.g. Pizza, Idli, Dosa"
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border">
                            <label className="text-xs font-bold text-gray-700 block uppercase">Disliked Foods / Food Aversions</label>
                            <div className="flex flex-wrap gap-2">
                                {dislikesOptions.map(tag => {
                                    const active = selectedDislikes.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setSelectedDislikes(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${active ? 'bg-red-500 border-red-500 text-white shadow-xs' : 'bg-white hover:bg-gray-50 border-gray-250 text-gray-600'}`}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-gray-600 block">Other Food Dislikes (Comma separated)</label>
                                <input
                                    type="text"
                                    value={customDislikedText}
                                    onChange={(e) => setCustomDislikedText(e.target.value)}
                                    placeholder="e.g. Mushrooms, Spicy curry"
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none bg-white"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Favorite Fruits</label>
                                <input
                                    type="text"
                                    value={prefsForm.favoriteFruits}
                                    onChange={(e) => setPrefsForm(prev => ({ ...prev, favoriteFruits: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Favorite Vegetables</label>
                                <input
                                    type="text"
                                    value={prefsForm.favoriteVegetables}
                                    onChange={(e) => setPrefsForm(prev => ({ ...prev, favoriteVegetables: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-bold text-gray-600">Favorite Snacks</label>
                                <input
                                    type="text"
                                    value={prefsForm.favoriteSnacks}
                                    onChange={(e) => setPrefsForm(prev => ({ ...prev, favoriteSnacks: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Water Intake (ml/day)</label>
                                <input
                                    type="number"
                                    value={prefsForm.waterIntake}
                                    onChange={(e) => setPrefsForm(prev => ({ ...prev, waterIntake: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Activity Level</label>
                                <select
                                    value={prefsForm.activityLevel}
                                    onChange={(e) => setPrefsForm(prev => ({ ...prev, activityLevel: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="low">Low</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Sleep Duration (hrs)</label>
                                <input
                                    type="number"
                                    value={prefsForm.sleepDuration}
                                    onChange={(e) => setPrefsForm(prev => ({ ...prev, sleepDuration: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Sleep Quality</label>
                                <select
                                    value={prefsForm.sleepQuality}
                                    onChange={(e) => setPrefsForm(prev => ({ ...prev, sleepQuality: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="Poor">Poor</option>
                                    <option value="Average">Average</option>
                                    <option value="Good">Good</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Screen Time (hrs)</label>
                                <input
                                    type="number"
                                    value={prefsForm.screenTime}
                                    onChange={(e) => setPrefsForm(prev => ({ ...prev, screenTime: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Eating Habits</label>
                                <select
                                    value={prefsForm.eatingHabits}
                                    onChange={(e) => setPrefsForm(prev => ({ ...prev, eatingHabits: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="poor">Poor</option>
                                    <option value="average">Average</option>
                                    <option value="good">Good</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Section 4: Medical Reports Manager */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-gray-900">Medical Reports Repository</h3>
                        <p className="text-gray-400 text-xs font-bold uppercase">HOSPITAL BRIEFS & LAB RECORD ATTACHMENTS</p>
                    </div>
                    {!isAddingReport && editingReportIdx === null && (
                        <button
                            onClick={() => setIsAddingReport(true)}
                            className="px-4 py-2 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition shadow"
                        >
                            + Upload Report
                        </button>
                    )}
                </div>

                {/* Staging new report/edit report form inline */}
                {(isAddingReport || editingReportIdx !== null) && (
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-6 space-y-4">
                        <h4 className="font-extrabold text-gray-800 text-base">
                            {isAddingReport ? 'Add New Medical Report' : 'Edit Report Metadata'}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Report Name</label>
                                <input
                                    type="text"
                                    value={tempReport.reportName}
                                    onChange={(e) => setTempReport(prev => ({ ...prev, reportName: e.target.value }))}
                                    placeholder="e.g. CBC Blood Panel"
                                    className="w-full p-2.5 text-sm border rounded-lg outline-none bg-white focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Report Date</label>
                                <input
                                    type="date"
                                    value={tempReport.reportDate}
                                    onChange={(e) => setTempReport(prev => ({ ...prev, reportDate: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg outline-none bg-white focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Hospital / Laboratory</label>
                                <input
                                    type="text"
                                    value={tempReport.hospitalName}
                                    onChange={(e) => setTempReport(prev => ({ ...prev, hospitalName: e.target.value }))}
                                    placeholder="e.g. City General Diagnostics"
                                    className="w-full p-2.5 text-sm border rounded-lg outline-none bg-white focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Referral Doctor</label>
                                <input
                                    type="text"
                                    value={tempReport.doctorName}
                                    onChange={(e) => setTempReport(prev => ({ ...prev, doctorName: e.target.value }))}
                                    placeholder="e.g. Dr. Jane Doe"
                                    className="w-full p-2.5 text-sm border rounded-lg outline-none bg-white focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-bold text-gray-600">Comments</label>
                                <textarea
                                    value={tempReport.comments}
                                    onChange={(e) => setTempReport(prev => ({ ...prev, comments: e.target.value }))}
                                    placeholder="Optional doctor feedback or parental observations..."
                                    className="w-full h-16 p-2.5 text-sm border rounded-lg outline-none bg-white focus:ring-1 focus:ring-primary resize-none font-medium text-gray-700"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Attachment File</label>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => setTempReport(prev => ({ ...prev, file: e.target.files[0] }))}
                                    className="w-full p-2 text-xs border rounded-lg outline-none bg-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600">Status</label>
                                <select
                                    value={tempReport.status}
                                    onChange={(e) => setTempReport(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full p-2.5 text-sm border rounded-lg outline-none bg-white focus:ring-1 focus:ring-primary"
                                >
                                    <option value="Not Reviewed">Not Reviewed</option>
                                    <option value="Reviewed">Reviewed</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setIsAddingReport(false);
                                    setEditingReportIdx(null);
                                    setTempReport({
                                        reportName: '',
                                        reportDate: '',
                                        hospitalName: '',
                                        doctorName: '',
                                        comments: '',
                                        status: 'Not Reviewed',
                                        file: null
                                    });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={isAddingReport ? saveNewReport : saveEditReport}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-blue-600 transition shadow-sm"
                            >
                                {isAddingReport ? 'Upload Attachment' : 'Save Report Details'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Reports List */}
                {!profile.medicalReports || profile.medicalReports.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-8 text-center text-gray-500 text-sm font-semibold">
                        🔬 No medical reports uploaded. Use "+ Upload Report" to store documents.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.medicalReports.map((report, idx) => (
                            <div key={report._id || idx} className="bg-gray-50 border rounded-2xl p-5 relative flex flex-col justify-between hover:shadow-sm transition">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-bold">
                                            {report.hospitalName}
                                        </span>
                                        <button
                                            onClick={() => handleReportStatusToggle(report._id, report.status)}
                                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition border ${report.status === 'Reviewed' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
                                        >
                                            {report.status || 'Not Reviewed'}
                                        </button>
                                    </div>
                                    <h4 className="font-extrabold text-gray-900 text-base leading-snug">{report.reportName}</h4>
                                    <p className="text-xs text-gray-400 font-medium">Doctor: Dr. {report.doctorName} • Date: {report.reportDate ? new Date(report.reportDate).toLocaleDateString() : '--'}</p>
                                    {report.comments && (
                                        <p className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-100 font-medium italic">
                                            "{report.comments}"
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                                    {report.attachment ? (
                                        <a
                                            href={report.attachment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-black flex items-center gap-1"
                                        >
                                            <span>📄</span> View Document
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-400 font-bold italic">No document</span>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => triggerEditReportMode(idx)}
                                            className="text-xs text-gray-500 hover:text-indigo-600 font-bold"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleReportDelete(report._id)}
                                            className="text-xs text-red-500 hover:text-red-700 font-bold"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileInfoAndReports;
