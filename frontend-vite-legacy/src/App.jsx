import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ParentLayout from './layouts/ParentLayout';
import DoctorLayout from './layouts/DoctorLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import ParentDashboard from './pages/parent/ParentDashboard';
import ChildDetails from './pages/parent/ChildDetails';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientDetails from './pages/doctor/PatientDetails';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorConsultations from './pages/doctor/DoctorConsultations';   
import DoctorResources from './pages/doctor/DoctorResources';
import DoctorAnalytics from './pages/doctor/DoctorAnalytics';
import KidsLayout from './layouts/KidsLayout';
import KidsDashboard from './pages/kids/KidsDashboard';
import ComingSoon from './pages/common/ComingSoon';
import PediatricianDirectory from './pages/parent/Directory';
import BookAppointment from './pages/parent/BookAppointment';
import MyAppointments from './pages/parent/MyAppointments';
import ParentProfile from './pages/parent/ParentProfile';
import DoctorAccess from './pages/parent/DoctorAccess';
import ResourcesLibrary from './pages/parent/ResourcesLibrary';

function App() {
    return (
        <AuthProvider>
            <Toaster position="top-center" />
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/" element={<LandingPage />} />

                    {/* Parent Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
                        <Route path="/parent" element={<ParentLayout />}>
                            <Route path="dashboard" element={<ParentDashboard />} />
                            <Route path="child/:id" element={<ChildDetails />} />
                            <Route path="resources" element={<ResourcesLibrary />} />
                            <Route path="access" element={<DoctorAccess />} />
                            <Route path="directory" element={<PediatricianDirectory />} />
                            <Route path="book-appointment/:hospitalId" element={<BookAppointment />} />
                            <Route path="my-appointments" element={<MyAppointments />} />
                            <Route path="profile" element={<ParentProfile />} />
                        </Route>
                    </Route>

                    {/* Doctor Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                        <Route path="/doctor" element={<DoctorLayout />}>
                            <Route path="dashboard" element={<DoctorDashboard />} />
                            <Route path="patients/:id" element={<PatientDetails />} />
                            <Route path="profile" element={<DoctorProfile />} />
                            <Route path="appointments" element={<DoctorConsultations />} />
                            <Route path="resources" element={<DoctorResources />} />
                            <Route path="analytics" element={<DoctorAnalytics />} />
                        </Route>
                    </Route>

                    {/* Kids Routes (Protected by Parent Role implicitly via entry point, but we enforce accessible by Parent) */}
                    <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
                        <Route path="/kids" element={<KidsLayout />}>
                            <Route path=":id/dashboard" element={<KidsDashboard />} />
                        </Route>
                    </Route>

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
