"use client";
import AdminUsers from './AdminUsers';

const AdminDoctors = () => {
    return (
        <AdminUsers
            defaultRoleFilter="doctor"
            pageTitle="Doctor & Specialist Accounts"
            pageSubtitle="Monitor healthcare providers, medical licenses, and connected families."
        />
    );
};

export default AdminDoctors;
