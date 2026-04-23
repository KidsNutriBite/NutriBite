import fs from 'fs';
import path from 'path';

const appDir = path.join(process.cwd(), 'src/app');

// Ensure appDir exists
if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
}

// 1. Root Layout
const layoutContent = `
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'KidsNutriBite',
  description: 'AI-Powered Pediatric Nutrition Assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Toaster position="top-center" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
`;
fs.writeFileSync(path.join(appDir, 'layout.js'), layoutContent);

// 2. Map routes to page wrappers
const routes = {
    'page.js': 'import LandingPage from "../react_pages/LandingPage"; export default function Page() { return <LandingPage />; }',
    
    // Auth Routes
    'login/page.js': 'import Login from "../../react_pages/auth/Login"; export default function Page() { return <Login />; }',
    'register/page.js': 'import Register from "../../react_pages/auth/Register"; export default function Page() { return <Register />; }',
    'forgot-password/page.js': 'import ForgotPassword from "../../react_pages/auth/ForgotPassword"; export default function Page() { return <ForgotPassword />; }',
    'reset-password/page.js': 'import ResetPassword from "../../react_pages/auth/ResetPassword"; export default function Page() { return <ResetPassword />; }',
    
    // Parent Routes
    'parent/layout.js': 'import ParentLayout from "../../layouts/ParentLayout"; export default function Layout({children}) { return <ParentLayout>{children}</ParentLayout>; }',
    'parent/dashboard/page.js': 'import ParentDashboard from "../../../react_pages/parent/ParentDashboard"; export default function Page() { return <ParentDashboard />; }',
    'parent/child/[id]/page.js': 'import ChildDetails from "../../../../react_pages/parent/ChildDetails"; export default function Page() { return <ChildDetails />; }',
    'parent/resources/page.js': 'import ResourcesLibrary from "../../../react_pages/parent/ResourcesLibrary"; export default function Page() { return <ResourcesLibrary />; }',
    'parent/access/page.js': 'import DoctorAccess from "../../../react_pages/parent/DoctorAccess"; export default function Page() { return <DoctorAccess />; }',
    'parent/directory/page.js': 'import PediatricianDirectory from "../../../react_pages/parent/Directory"; export default function Page() { return <PediatricianDirectory />; }',
    'parent/book-appointment/[hospitalId]/page.js': 'import BookAppointment from "../../../../react_pages/parent/BookAppointment"; export default function Page() { return <BookAppointment />; }',
    'parent/my-appointments/page.js': 'import MyAppointments from "../../../react_pages/parent/MyAppointments"; export default function Page() { return <MyAppointments />; }',
    'parent/profile/page.js': 'import ParentProfile from "../../../react_pages/parent/ParentProfile"; export default function Page() { return <ParentProfile />; }',
    
    // Doctor Routes
    'doctor/layout.js': 'import DoctorLayout from "../../layouts/DoctorLayout"; export default function Layout({children}) { return <DoctorLayout>{children}</DoctorLayout>; }',
    'doctor/dashboard/page.js': 'import DoctorDashboard from "../../../react_pages/doctor/DoctorDashboard"; export default function Page() { return <DoctorDashboard />; }',
    'doctor/patients/[id]/page.js': 'import PatientDetails from "../../../../react_pages/doctor/PatientDetails"; export default function Page() { return <PatientDetails />; }',
    'doctor/profile/page.js': 'import DoctorProfile from "../../../react_pages/doctor/DoctorProfile"; export default function Page() { return <DoctorProfile />; }',
    'doctor/appointments/page.js': 'import DoctorConsultations from "../../../react_pages/doctor/DoctorConsultations"; export default function Page() { return <DoctorConsultations />; }',
    'doctor/resources/page.js': 'import DoctorResources from "../../../react_pages/doctor/DoctorResources"; export default function Page() { return <DoctorResources />; }',
    'doctor/analytics/page.js': 'import DoctorAnalytics from "../../../react_pages/doctor/DoctorAnalytics"; export default function Page() { return <DoctorAnalytics />; }',
    
    // Kids Routes
    'kids/layout.js': 'import KidsLayout from "../../layouts/KidsLayout"; export default function Layout({children}) { return <KidsLayout>{children}</KidsLayout>; }',
    'kids/[id]/dashboard/page.js': 'import KidsDashboard from "../../../../react_pages/kids/KidsDashboard"; export default function Page() { return <KidsDashboard />; }',
};

// Create folders and pages
for (const [routePath, content] of Object.entries(routes)) {
    const fullPath = path.join(appDir, routePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content);
}
console.log('App router structure scaffolded completely.');
