import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import Sidebar from '../components/navigation/Sidebar';

const MainLayout = ({ role = 'USER' }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar for Mobile & Desktop */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                role={role}
            />

            {/* Main Content Area */}
            <div className="lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
                <Navbar onMenuClick={toggleSidebar} />

                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
