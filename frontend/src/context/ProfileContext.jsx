"use client";
import { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { getMyProfiles } from '../api/profile.api';
import useAuth from '../hooks/useAuth';

export const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [loadingProfiles, setLoadingProfiles] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            if (!isAuthenticated || user?.role !== 'parent') {
                setProfiles([]);
                setLoadingProfiles(false);
                return;
            }

            try {
                const res = await getMyProfiles();
                const fetchedProfiles = Array.isArray(res) ? res : res.data || [];
                setProfiles(fetchedProfiles);

                if (fetchedProfiles.length > 0) {
                    const savedId = localStorage.getItem('selectedChildId');
                    const profileExists = fetchedProfiles.find(p => p._id === savedId);
                    
                    if (profileExists) {
                        setSelectedProfileId(savedId);
                    } else {
                        setSelectedProfileId(fetchedProfiles[0]._id);
                        localStorage.setItem('selectedChildId', fetchedProfiles[0]._id);
                    }
                }
            } catch (error) {
                console.error('Error fetching profiles in context:', error);
            } finally {
                setLoadingProfiles(false);
            }
        };

        fetchProfiles();
    }, [isAuthenticated, user]);

    const changeProfile = (id) => {
        setSelectedProfileId(id);
        localStorage.setItem('selectedChildId', id);
    };

    const value = useMemo(() => ({
        profiles,
        selectedProfileId,
        selectedProfile: profiles.find(p => p._id === selectedProfileId) || null,
        changeProfile,
        loadingProfiles,
        setProfiles
    }), [profiles, selectedProfileId, loadingProfiles]);

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
