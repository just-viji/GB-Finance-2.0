import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="md:max-w-7xl md:mx-auto px-4 h-16 flex justify-between items-center">
        <h1 className="text-xl font-bold text-brand-primary">GB Finance 2.0</h1>
        <p className="text-xs font-medium text-brand-secondary">Developed by Viji</p>
      </div>
    </header>
  );
};

export default Header;
