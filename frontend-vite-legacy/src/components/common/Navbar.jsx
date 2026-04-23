import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tight text-primary">NutriKid</span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-sm font-medium text-gray-700 transition hover:text-primary"
                        >
                            Log in
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-2 text-sm font-bold text-white transition rounded-full bg-primary hover:bg-blue-600 shadow-lg shadow-blue-500/30"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
