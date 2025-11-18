import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-surface/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-300 ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-6">
          {title && <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};