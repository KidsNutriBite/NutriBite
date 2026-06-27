"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createProfile } from '../../api/profile.api';
import toast from 'react-hot-toast';
const AddProfileForm = ({ onSuccess, onCancel }) => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [selectedLikes, setSelectedLikes] = useState([]);
    const [customLikedText, setCustomLikedText] = useState('');
    const [selectedDislikes, setSelectedDislikes] = useState([]);
    const [customDislikedText, setCustomDislikedText] = useState('');

    const likesOptions = ["Milk", "Fruits", "Vegetables", "Pasta", "Rice", "Chicken", "Eggs", "Paneer", "Dosa", "Idli", "Oats", "Bread", "Yogurt", "Soup", "Potatoes"];
    const dislikesOptions = ["Mushrooms", "Broccoli", "Bitter Gourd", "Eggplant", "Spinach", "Seafood", "Onions", "Garlic", "Spicy Foods", "Beans", "Peas", "Cauliflower"];

    // Complete form state mapping the Mongoose schema
    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        name: '',
        dob: '',
        gender: 'male',
        bloodGroup: 'O+',
        avatar: 'lion',
        sportsActivityLevel: 'Moderately Active',
        prematureBirth: { isPremature: false, weeksPremature: 0 },
        
        // Step 2: Physical Details
        height: '',
        weight: '',
        waistCircumference: '',

        // Step 3: Health Details
        healthConditions: [],
        otherCondition: '',

        // Step 4: Family History
        siblingConditions: { hasCondition: false, description: '' },
        motherConditions: { hasCondition: false, description: '' },
        fatherConditions: { hasCondition: false, description: '' },
        nutritionConcerns: '',

        // Step 6: Location Details
        location: {
            country: 'India',
            state: '',
            city: '',
            address: ''
        },

        // Step 7: Goals
        goals: {
            primary: 'General Wellness',
            secondary: []
        },

        // Step 8: Preferences
        preferences: {
            favoriteFoods: '',
            dislikedFoods: '',
            favoriteFruits: '',
            favoriteVegetables: '',
            favoriteSnacks: '',
            waterIntake: '1000', // ml
            activityLevel: 'moderate',
            sleepDuration: '9', // hours
            sleepQuality: 'Average',
            screenTime: '1', // hours
            eatingHabits: 'average'
        }
    });

    // Step 1 files
    const [profileImage, setProfileImage] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    // Step 5: Local list of medical reports (each with metadata and file object)
    const [reportsList, setReportsList] = useState([]);
    
    // Staging fields for single report input in Step 5
    const [tempReport, setTempReport] = useState({
        reportName: '',
        reportDate: '',
        hospitalName: '',
        doctorName: '',
        comments: '',
        status: 'Not Reviewed',
        file: null
    });

    const calculateAge = (dobString) => {
        if (!dobString) return '';
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age >= 0 ? age : 0;
    };

    const handleConditionToggle = (id) => {
        setFormData(prev => {
            const exists = prev.healthConditions.includes(id);
            if (exists) {
                return { ...prev, healthConditions: prev.healthConditions.filter(c => c !== id) };
            } else {
                return { ...prev, healthConditions: [...prev.healthConditions, id] };
            }
        });
    };

    const handleGoalToggle = (id) => {
        setFormData(prev => {
            const exists = prev.goals.secondary.includes(id);
            if (exists) {
                return {
                    ...prev,
                    goals: {
                        ...prev.goals,
                        secondary: prev.goals.secondary.filter(g => g !== id)
                    }
                };
            } else {
                return {
                    ...prev,
                    goals: {
                        ...prev.goals,
                        secondary: [...prev.goals.secondary, id]
                    }
                };
            }
        });
    };

    const handlePrimaryGoalToggle = (id) => {
        setFormData(prev => {
            const current = prev.goals.primary
                ? prev.goals.primary.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            const exists = current.includes(id);
            const updated = exists
                ? current.filter(x => x !== id)
                : [...current, id];
            return {
                ...prev,
                goals: {
                    ...prev.goals,
                    primary: updated.join(', ')
                }
            };
        });
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Profile picture must be under 5MB");
            return;
        }
        setProfileImage(file);
        setProfileImagePreview(URL.createObjectURL(file));
    };

    const addReportToList = () => {
        if (!tempReport.reportName.trim()) {
            toast.error("Report name is required");
            return;
        }
        if (!tempReport.reportDate) {
            toast.error("Report date is required");
            return;
        }
        if (!tempReport.hospitalName.trim()) {
            toast.error("Hospital name is required");
            return;
        }
        if (!tempReport.doctorName.trim()) {
            toast.error("Doctor name is required");
            return;
        }
        if (!tempReport.file) {
            toast.error("Please attach the report file");
            return;
        }

        setReportsList(prev => [...prev, tempReport]);
        // Reset temp report
        setTempReport({
            reportName: '',
            reportDate: '',
            hospitalName: '',
            doctorName: '',
            comments: '',
            status: 'Not Reviewed',
            file: null
        });
        toast.success("Medical report staged successfully!");
    };

    const removeStagedReport = (index) => {
        setReportsList(prev => prev.filter((_, i) => i !== index));
    };

    const validateStep = (currentStep) => {
        if (currentStep === 1) {
            if (!formData.name.trim()) return "Child's name is required";
            if (!formData.dob) return "Date of birth is required";
            if (new Date(formData.dob) > new Date()) return "Future date of birth is not allowed";
            if (!formData.bloodGroup) return "Blood group is required";
        }
        if (currentStep === 2) {
            const h = Number(formData.height);
            const w = Number(formData.weight);
            const wc = Number(formData.waistCircumference);
            if (!formData.height || h < 50 || h > 220) return "Height must be between 50 cm and 220 cm";
            if (!formData.weight || w < 1 || w > 200) return "Weight must be between 1 kg and 200 kg";
            if (!formData.waistCircumference || wc < 20 || wc > 200) return "Waist Circumference must be between 20 cm and 200 cm";
        }
        if (currentStep === 6) {
            if (!formData.location.country.trim()) return "Country is required";
            if (!formData.location.state.trim()) return "State is required";
            if (!formData.location.city.trim()) return "City/Town/Village is required";
            if (!formData.location.address.trim()) return "Address is required";
        }
        if (currentStep === 7) {
            if (!formData.goals.primary) return "Primary goal is required";
        }
        if (currentStep === 8) {
            if (selectedLikes.length === 0 && !customLikedText.trim()) {
                return "Please select or enter at least one food like (favorite food)";
            }
            if (selectedDislikes.length === 0 && !customDislikedText.trim()) {
                return "Please select or enter at least one food dislike (aversion)";
            }
        }
        return null;
    };

    const isStepValid = (s) => {
        return !validateStep(s);
    };

    const nextStep = () => {
        const validationError = validateStep(step);
        if (validationError) {
            toast.error(validationError);
            return;
        }
        setStep(s => s + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(s => s - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (step < 8) {
            nextStep();
            return;
        }

        const validationError = validateStep(8);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Reconstruct clinical medical reports array for JSON schema
            const mappedReports = reportsList.map((rep, idx) => ({
                reportName: rep.reportName,
                reportDate: rep.reportDate,
                hospitalName: rep.hospitalName,
                doctorName: rep.doctorName,
                comments: rep.comments,
                status: rep.status,
                fileIndex: idx // Match index of files
            }));

            const favFoods = [...selectedLikes, customLikedText.trim()].filter(Boolean).join(', ');
            const disFoods = [...selectedDislikes, customDislikedText.trim()].filter(Boolean).join(', ');

            // Prepare Payload Object matching Profile Model Schema
            const payload = {
                name: formData.name,
                dob: formData.dob,
                gender: formData.gender,
                bloodGroup: formData.bloodGroup,
                avatar: formData.avatar,
                height: Number(formData.height),
                weight: Number(formData.weight),
                waistCircumference: Number(formData.waistCircumference),
                location: formData.location,
                healthConditions: formData.healthConditions,
                otherCondition: formData.otherCondition,
                familyHistory: formData.familyHistory,
                sportsActivityLevel: formData.sportsActivityLevel,
                prematureBirth: formData.prematureBirth,
                goals: formData.goals,
                preferences: {
                    ...formData.preferences,
                    favoriteFoods: favFoods,
                    dislikedFoods: disFoods,
                    waterIntake: Number(formData.preferences.waterIntake),
                    sleepDuration: Number(formData.preferences.sleepDuration),
                    screenTime: Number(formData.preferences.screenTime)
                },
                medicalReports: mappedReports
            };

            const data = new FormData();
            data.append('data', JSON.stringify(payload));

            // Append Profile Image File if uploaded
            if (profileImage) {
                data.append('profileImage', profileImage);
            }

            // Append multiple medical files matching key indices
            reportsList.forEach((rep, idx) => {
                if (rep.file) {
                    data.append(`medicalReportFile_${idx}`, rep.file);
                }
            });

            const res = await createProfile(data);
            const created = res.data || res;
            
            toast.success("Child Profile created successfully!");
            if (onSuccess) onSuccess(created);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create child profile');
            toast.error(err.response?.data?.message || 'Failed to create child profile');
        } finally {
            setLoading(false);
        }
    };

    const healthConditionsOptions = [
        "Asthma", "Diabetes", "Obesity", "Underweight", "Anemia", "Food Allergies",
        "Skin Conditions", "Dental Problems", "Digestive Issues", "Frequent Fever",
        "Vision Problems", "Hearing Problems"
    ];

    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const avatars = ['lion', 'bear', 'rabbit', 'fox', 'cat', 'dog'];
    const goalsList = [
        "Improve Nutrition", "Track Growth", "Weight Management", 
        "Manage Medical Condition", "Improve Immunity", "Get Doctor Guidance", "General Wellness"
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Progress Bar */}
            <div className="flex justify-between items-center mb-8 relative px-2">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 -z-10"></div>
                {Array.from({ length: 8 }).map((_, i) => {
                    const stepNum = i + 1;
                    return (
                        <div 
                            key={stepNum} 
                            onClick={() => {
                                // Allow returning back to already validated steps
                                if (stepNum < step && isStepValid(stepNum)) {
                                    setStep(stepNum);
                                }
                            }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-white dark:bg-slate-900 border-2 transition-all cursor-pointer ${
                                step >= stepNum 
                                ? 'border-primary text-primary shadow-sm ring-4 ring-primary/10' 
                                : 'border-slate-350 text-slate-400 dark:border-slate-700'
                            }`}
                        >
                            {stepNum}
                        </div>
                    );
                })}
            </div>

            {/* Step 1: Basic Information */}
            {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right fade-in duration-300">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Basic Information</h3>
                        <p className="text-sm text-slate-500">Provide core identification metrics for your child.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                        {/* Profile Photo Upload */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden relative shadow-inner">
                                {profileImagePreview ? (
                                    <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center">
                                        <svg className="w-7 h-7 text-slate-400 dark:text-slate-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                        </svg>
                                        <p className="text-[9px] font-bold uppercase tracking-wider">Photo</p>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleProfileImageChange} 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                                />
                            </div>

                            {profileImagePreview && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProfileImage(null);
                                        setProfileImagePreview(null);
                                    }}
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-10 cursor-pointer"
                                    title="Remove Photo"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 w-full space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Child's Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter full name"
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-slate-900 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={formData.dob}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:bg-slate-900"
                            />
                            {formData.dob && (
                                <p className="text-xs text-primary mt-1 font-bold">
                                    Calculated: {calculateAge(formData.dob)} years old
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Gender <span className="text-red-500">*</span></label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Blood Group <span className="text-red-500">*</span></label>
                            <select
                                value={formData.bloodGroup}
                                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            >
                                {bloodGroups.map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Select Mascot / Avatar</label>
                        <div className="flex gap-4 overflow-x-auto p-1 pb-2">
                            {avatars.map((av) => (
                                <button
                                    key={av}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, avatar: av })}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2 transition-all ${formData.avatar === av ? 'border-primary bg-blue-50 dark:bg-slate-800 scale-110 shadow-md' : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100'}`}
                                >
                                    {av === 'lion' && '🦁'}
                                    {av === 'bear' && '🐻'}
                                    {av === 'rabbit' && '🐰'}
                                    {av === 'fox' && '🦊'}
                                    {av === 'cat' && '🐱'}
                                    {av === 'dog' && '🐶'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Premature Birth Section */}
                    <div className="border-t pt-4 mt-4 space-y-3">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Was the child born prematurely?</label>
                        <div className="flex gap-4">
                            {['No', 'Yes'].map((opt, i) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setFormData({
                                        ...formData,
                                        prematureBirth: {
                                            isPremature: i === 1,
                                            weeksPremature: i === 0 ? 0 : formData.prematureBirth.weeksPremature
                                        }
                                    })}
                                    className={`px-6 py-2 rounded-xl text-sm font-bold border transition ${formData.prematureBirth.isPremature === (i === 1) ? 'bg-primary border-primary text-white shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        {formData.prematureBirth.isPremature && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-bold text-slate-550 mb-1">Weeks Premature</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.prematureBirth.weeksPremature || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        prematureBirth: {
                                            ...formData.prematureBirth,
                                            weeksPremature: Number(e.target.value)
                                        }
                                    })}
                                    placeholder="Enter number of weeks"
                                    className="w-full max-w-xs border border-slate-300 dark:border-slate-750 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:bg-slate-900"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Physical Details */}
            {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right fade-in duration-300">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Physical Details</h3>
                        <p className="text-sm text-slate-500">Provide basic physiological dimensions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Height (cm) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                placeholder="50 - 220"
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:bg-slate-900"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Allowed range: 50cm to 220cm</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Weight (kg) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                placeholder="1 - 200"
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:bg-slate-900"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Allowed range: 1kg to 200kg</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Waist Circumference (cm) <span className="text-red-500">*</span></label>
                                <div className="relative group flex items-center">
                                    <span className="material-symbols-outlined text-slate-400 text-base cursor-pointer select-none">info</span>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs rounded-xl p-3 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 leading-relaxed text-center font-normal">
                                        Waist circumference helps assess body fat distribution and can indicate potential health risks related to obesity.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                </div>
                            </div>
                            <input
                                type="number"
                                value={formData.waistCircumference}
                                onChange={(e) => setFormData({ ...formData, waistCircumference: e.target.value })}
                                placeholder="20 - 200"
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:bg-slate-900"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Allowed range: 20cm to 200cm</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Health Details */}
            {step === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right fade-in duration-300">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Health Conditions</h3>
                        <p className="text-sm text-slate-500">Select any medical conditions currently active or previously diagnosed.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {healthConditionsOptions.map(cond => {
                            const isChecked = formData.healthConditions.includes(cond);
                            return (
                                <div
                                    key={cond}
                                    onClick={() => handleConditionToggle(cond)}
                                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${isChecked ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm' : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${isChecked ? 'bg-primary border-primary' : 'border-slate-300 bg-white'}`}>
                                        {isChecked && <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>}
                                    </div>
                                    <span className="text-sm leading-none">{cond}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Other Conditions / Symptoms</label>
                        <textarea
                            value={formData.otherCondition}
                            onChange={(e) => setFormData({ ...formData, otherCondition: e.target.value })}
                            placeholder="Describe any other conditions or allergies not listed above..."
                            rows={3}
                            className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:bg-slate-900"
                        />
                    </div>
                </div>
            )}

            {/* Step 4: Family History */}
            {step === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Family History</h3>
                        <p className="text-sm text-slate-500">Help identify genetic indicators and hereditary patterns.</p>
                    </div>

                    <div className="space-y-4">
                        {/* Siblings */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Does any sibling have medical conditions?</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, siblingConditions: { ...formData.siblingConditions, hasCondition: true } })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.siblingConditions.hasCondition ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200'}`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, siblingConditions: { hasCondition: false, description: '' } })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!formData.siblingConditions.hasCondition ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200'}`}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                            {formData.siblingConditions.hasCondition && (
                                <textarea
                                    value={formData.siblingConditions.description}
                                    onChange={(e) => setFormData({ ...formData, siblingConditions: { ...formData.siblingConditions, description: e.target.value } })}
                                    placeholder="Describe siblings' conditions..."
                                    rows={2}
                                    className="w-full border border-slate-350 dark:border-slate-700 rounded-xl px-4 py-2 bg-white dark:bg-slate-900 outline-none text-sm focus:border-primary"
                                />
                            )}
                        </div>

                        {/* Mother */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Does mother have hereditary conditions?</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, motherConditions: { ...formData.motherConditions, hasCondition: true } })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.motherConditions.hasCondition ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200'}`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, motherConditions: { hasCondition: false, description: '' } })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!formData.motherConditions.hasCondition ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200'}`}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                            {formData.motherConditions.hasCondition && (
                                <textarea
                                    value={formData.motherConditions.description}
                                    onChange={(e) => setFormData({ ...formData, motherConditions: { ...formData.motherConditions, description: e.target.value } })}
                                    placeholder="Describe mother's hereditary conditions..."
                                    rows={2}
                                    className="w-full border border-slate-350 dark:border-slate-700 rounded-xl px-4 py-2 bg-white dark:bg-slate-900 outline-none text-sm focus:border-primary"
                                />
                            )}
                        </div>

                        {/* Father */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Does father have hereditary conditions?</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, fatherConditions: { ...formData.fatherConditions, hasCondition: true } })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.fatherConditions.hasCondition ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200'}`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, fatherConditions: { hasCondition: false, description: '' } })}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!formData.fatherConditions.hasCondition ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200'}`}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                            {formData.fatherConditions.hasCondition && (
                                <textarea
                                    value={formData.fatherConditions.description}
                                    onChange={(e) => setFormData({ ...formData, fatherConditions: { ...formData.fatherConditions, description: e.target.value } })}
                                    placeholder="Describe father's hereditary conditions..."
                                    rows={2}
                                    className="w-full border border-slate-350 dark:border-slate-700 rounded-xl px-4 py-2 bg-white dark:bg-slate-900 outline-none text-sm focus:border-primary"
                                />
                            )}
                        </div>

                        {/* Nutrition concerns */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Family Nutrition Concerns</label>
                            <textarea
                                value={formData.nutritionConcerns}
                                onChange={(e) => setFormData({ ...formData, nutritionConcerns: e.target.value })}
                                placeholder="E.g. Diabetes, Obesity, Heart Disease, Hypertension..."
                                rows={2}
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 bg-white dark:bg-slate-900 outline-none text-sm focus:border-primary"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 5: Medical Reports */}
            {step === 5 && (
                <div className="space-y-4 animate-in slide-in-from-right fade-in duration-300">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Medical Reports</h3>
                        <p className="text-sm text-slate-500">Attach clinical documents and record checkup history.</p>
                    </div>

                    {/* Staged list */}
                    {reportsList.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Staged Reports ({reportsList.length})</p>
                            {reportsList.map((rep, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                    <div className="overflow-hidden">
                                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">{rep.reportName}</h4>
                                        <p className="text-xs text-slate-400">{rep.hospitalName} • Dr. {rep.doctorName} • {new Date(rep.reportDate).toLocaleDateString()}</p>
                                        <p className="text-xs text-primary truncate max-w-xs">📎 {rep.file?.name}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeStagedReport(idx)}
                                        className="text-slate-400 hover:text-red-500 p-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Form to stage a single report */}
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Add A Report Document</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Report Name</label>
                                <input
                                    type="text"
                                    value={tempReport.reportName}
                                    onChange={(e) => setTempReport({ ...tempReport, reportName: e.target.value })}
                                    placeholder="e.g. Annual Blood Panel"
                                    className="w-full border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Report Date</label>
                                <input
                                    type="date"
                                    value={tempReport.reportDate}
                                    onChange={(e) => setTempReport({ ...tempReport, reportDate: e.target.value })}
                                    className="w-full border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Hospital / Lab Name</label>
                                <input
                                    type="text"
                                    value={tempReport.hospitalName}
                                    onChange={(e) => setTempReport({ ...tempReport, hospitalName: e.target.value })}
                                    placeholder="e.g. City Pediatrics Center"
                                    className="w-full border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Doctor Name</label>
                                <input
                                    type="text"
                                    value={tempReport.doctorName}
                                    onChange={(e) => setTempReport({ ...tempReport, doctorName: e.target.value })}
                                    placeholder="e.g. Dr. Jane Smith"
                                    className="w-full border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Comments / Notes</label>
                            <textarea
                                value={tempReport.comments}
                                onChange={(e) => setTempReport({ ...tempReport, comments: e.target.value })}
                                placeholder="Any notes on results..."
                                rows={2}
                                className="w-full border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-sm outline-none"
                            />
                        </div>

                        {/* File Picker */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full sm:w-auto relative">
                                <button
                                    type="button"
                                    className="w-full sm:w-auto px-4 py-2 border border-dashed border-slate-400 text-slate-600 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 flex items-center justify-center gap-1 hover:border-primary transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">attach_file</span>
                                    <span>{tempReport.file ? "Change Attachment" : "Attach File"}</span>
                                </button>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            if (file.size > 5 * 1024 * 1024) {
                                                toast.error("File size must be under 5MB");
                                                return;
                                            }
                                            setTempReport({ ...tempReport, file });
                                        }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            {tempReport.file && (
                                <p className="text-xs text-green-600 font-bold truncate max-w-xs">✓ Staged: {tempReport.file.name}</p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={addReportToList}
                            className="w-full py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-750 transition-colors"
                        >
                            Stage Report
                        </button>
                    </div>
                </div>
            )}

            {/* Step 6: Location Details */}
            {step === 6 && (
                <div className="space-y-4 animate-in slide-in-from-right fade-in duration-300">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Location Details</h3>
                        <p className="text-sm text-slate-500">Provide geographical address details to complete demographic logs.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Country <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.location.country}
                                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, country: e.target.value } })}
                                placeholder="e.g. India"
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">State <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.location.state}
                                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })}
                                placeholder="e.g. Andhra Pradesh"
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">City/Town/Village <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={formData.location.city}
                                onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                                placeholder="e.g. Visakhapatnam"
                                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:bg-slate-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Address Details <span className="text-red-500">*</span></label>
                        <textarea
                            value={formData.location.address}
                            onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                            placeholder="Enter full residential address..."
                            rows={3}
                            className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-primary dark:bg-slate-900"
                        />
                    </div>
                </div>
            )}

            {/* Step 7: Why NutriKids? */}
            {step === 7 && (
                <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Why NutriKids?</h3>
                        <p className="text-sm text-slate-500">Help align goals and targets for automated suggestions.</p>
                    </div>

                    {/* Primary Goal */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">What is your Primary Goal? <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {goalsList.map(g => {
                                const isSelected = formData.goals.primary
                                    ? formData.goals.primary.split(',').map(s => s.trim()).includes(g)
                                    : false;
                                return (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => handlePrimaryGoalToggle(g)}
                                        className={`px-4 py-3 rounded-xl border-2 text-xs font-bold text-center transition-all ${isSelected ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-100 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
                                    >
                                        {g}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Secondary Goals */}
                    <div className="space-y-3 pt-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Select Secondary Goals (Multi-select)</label>
                        <div className="flex flex-wrap gap-2.5">
                            {goalsList.map(g => {
                                const isChecked = formData.goals.secondary.includes(g);
                                return (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => handleGoalToggle(g)}
                                        className={`px-4 py-2 rounded-full border-2 text-xs font-semibold transition-all ${isChecked ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-slate-250 dark:border-slate-700 text-slate-600 bg-white dark:bg-slate-900 hover:border-slate-350'}`}
                                    >
                                        {g}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 8: Child Preferences */}
            {step === 8 && (
                <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Child Preferences & Habits</h3>
                        <p className="text-sm text-slate-500">Provide dietary preferences and daily logs metrics.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Food Likes selection tags */}
                        <div className="col-span-1 md:col-span-2 space-y-3 p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">Food Likes / Favorite Foods</label>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                {likesOptions.map(tag => {
                                    const active = selectedLikes.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setSelectedLikes(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-500">Other Likes (Comma separated)</label>
                                <input
                                    type="text"
                                    value={customLikedText}
                                    onChange={(e) => setCustomLikedText(e.target.value)}
                                    placeholder="e.g. Pasta, Dosa, Waffles"
                                    className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 text-sm dark:bg-slate-900"
                                />
                            </div>
                        </div>

                        {/* Food Dislikes selection tags */}
                        <div className="col-span-1 md:col-span-2 space-y-3 p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">Food Dislikes / Aversions</label>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                {dislikesOptions.map(tag => {
                                    const active = selectedDislikes.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setSelectedDislikes(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-red-500 border-red-500 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-slate-550">Other Dislikes (Comma separated)</label>
                                <input
                                    type="text"
                                    value={customDislikedText}
                                    onChange={(e) => setCustomDislikedText(e.target.value)}
                                    placeholder="e.g. Bitter Gourd, Mushrooms"
                                    className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 text-sm dark:bg-slate-900"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-550 mb-1">Favorite Fruits</label>
                            <input
                                type="text"
                                value={formData.preferences.favoriteFruits}
                                onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, favoriteFruits: e.target.value } })}
                                placeholder="e.g. Mango, Apple"
                                className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 text-sm dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-550 mb-1">Favorite Vegetables</label>
                            <input
                                type="text"
                                value={formData.preferences.favoriteVegetables}
                                onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, favoriteVegetables: e.target.value } })}
                                placeholder="e.g. Carrot, Potato"
                                className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 text-sm dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-550 mb-1">Favorite Snacks</label>
                            <input
                                type="text"
                                value={formData.preferences.favoriteSnacks}
                                onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, favoriteSnacks: e.target.value } })}
                                placeholder="e.g. Roasted nuts, popcorn"
                                className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 text-sm dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-550 mb-1">Water Intake Target (ml/day)</label>
                            <input
                                type="number"
                                value={formData.preferences.waterIntake}
                                onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, waterIntake: e.target.value } })}
                                placeholder="e.g. 1500"
                                className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 text-sm dark:bg-slate-900"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-550 mb-1">Physical Activity (General)</label>
                            <select
                                value={formData.preferences.activityLevel}
                                onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, activityLevel: e.target.value } })}
                                className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-sm"
                            >
                                <option value="low">Low</option>
                                <option value="moderate">Moderate</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-550 mb-1">Sports Activity Level</label>
                            <select
                                value={formData.sportsActivityLevel}
                                onChange={(e) => setFormData({ ...formData, sportsActivityLevel: e.target.value })}
                                className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-sm"
                            >
                                <option value="Very Active">Very Active</option>
                                <option value="Active">Active</option>
                                <option value="Moderately Active">Moderately Active</option>
                                <option value="Low Activity">Low Activity</option>
                                <option value="Sedentary">Sedentary</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-550 mb-1">Sleep Duration (hrs/day)</label>
                            <input
                                type="number"
                                value={formData.preferences.sleepDuration}
                                onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, sleepDuration: e.target.value } })}
                                placeholder="e.g. 9"
                                className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 text-sm dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-550 mb-1">Sleep Quality</label>
                            <select
                                value={formData.preferences.sleepQuality}
                                onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, sleepQuality: e.target.value } })}
                                className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-sm"
                            >
                                <option value="Poor">Poor</option>
                                <option value="Average">Average</option>
                                <option value="Good">Good</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-550 mb-1">Screen Time (hrs/day)</label>
                            <input
                                type="number"
                                value={formData.preferences.screenTime}
                                onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, screenTime: e.target.value } })}
                                placeholder="e.g. 2"
                                className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 text-sm dark:bg-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-550 mb-1">Eating Habits</label>
                            <select
                                value={formData.preferences.eatingHabits}
                                onChange={(e) => setFormData({ ...formData, preferences: { ...formData.preferences, eatingHabits: e.target.value } })}
                                className="w-full border border-slate-300 dark:border-slate-750 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-sm"
                            >
                                <option value="poor">Poor</option>
                                <option value="average">Average</option>
                                <option value="good">Good</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Controls */}
            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                {step > 1 ? (
                    <button
                        type="button"
                        onClick={prevStep}
                        className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Back
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 text-slate-650 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                )}

                {step < 8 ? (
                    <button
                        type="button"
                        onClick={nextStep}
                        className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/95 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-8 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/95 transition-all hover:scale-[1.02] active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Creating Profile...' : 'Complete & Redirect'}
                    </button>
                )}
            </div>
        </form>
    );
};

export default AddProfileForm;

