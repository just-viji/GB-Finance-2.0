import React from 'react';
import { Page } from '../App';

interface BottomNavProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

const NavItem: React.FC<{
    page: Page;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    icon: React.ReactElement;
    label: string;
}> = ({ page, currentPage, setCurrentPage, icon, label }) => {
    const isActive = currentPage === page;
    return (
        <button
            onClick={() => setCurrentPage(page)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
                isActive
                    ? 'text-brand-primary'
                    : 'text-brand-secondary hover:text-brand-primary'
            }`}
        >
            {icon}
            <span className="text-xs font-medium mt-1">{label}</span>
        </button>
    );
};


const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setCurrentPage }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-md md:max-w-md md:mx-auto md:bottom-4 md:rounded-xl">
            <div className="flex justify-around items-center h-16">
                <NavItem
                    page="home"
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    label="Home"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                />
                <NavItem
                    page="transactions"
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    label="Transactions"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
                />
                 <NavItem
                    page="reports"
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    label="Reports"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
            </div>
        </nav>
    );
};

export default BottomNav;
