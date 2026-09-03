"use client";
import AdminUsers from './AdminUsers';

const AdminParents = () => {
    return (
        <AdminUsers
            defaultRoleFilter="parent"
            pageTitle="Parent Accounts"
            pageSubtitle="Monitor registered parents, linked child profiles, and platform engagement."
        />
    );
};

export default AdminParents;
