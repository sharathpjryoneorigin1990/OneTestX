"use client";

import { cn } from '@/utils/cn';
import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  withDot = false,
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  const variants = {
    default: 'bg-dark-700 text-gray-300',
    success: 'bg-green-900/30 text-green-400 border border-green-500/20',
    warning: 'bg-amber-900/30 text-amber-400 border border-amber-500/20',
    error: 'bg-red-900/30 text-red-400 border border-red-500/20',
    info: 'bg-blue-900/30 text-blue-400 border border-blue-500/20',
  };
  
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const dotColors = {
    default: 'bg-gray-400',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <span
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
    >
      {withDot && (
        <span
          className={cn(
            'mr-1.5 h-2 w-2 rounded-full',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
