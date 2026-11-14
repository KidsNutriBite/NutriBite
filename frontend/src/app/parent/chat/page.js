'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NutriGuideChat from '@/components/parent/chat/NutriGuideChat';
import { getMyProfiles } from '@/api/profile.api';

export default function ParentChatPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        getMyProfiles()
            .then(res => {
                const list = res?.data || res || [];
                setProfiles(Array.isArray(list) ? list : []);
            })
            .catch(err => {
                console.warn('Failed to load child profiles for chat:', err.message);
            });
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
            <NutriGuideChat onBack={() => router.push('/parent/dashboard')} profiles={profiles} />
        </div>
    );
}
