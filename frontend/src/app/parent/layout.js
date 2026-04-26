import ParentLayout from "../../layouts/ParentLayout"; 
import { ProfileProvider } from "../../context/ProfileContext";

export default function Layout({children}) { 
    return (
        <ProfileProvider>
            <ParentLayout>{children}</ParentLayout>
        </ProfileProvider>
    ); 
}