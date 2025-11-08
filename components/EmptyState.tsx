import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  return (
    <div className="text-center py-8 px-4">
      <div className="flex justify-center items-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
      <p className="text-sm text-brand-secondary mt-1">{message}</p>
    </div>
  );
};

export default EmptyState;