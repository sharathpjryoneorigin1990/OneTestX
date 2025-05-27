"use client";

import { cn } from '@/utils/cn';
import { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bordered' | 'gradient';
  children: ReactNode;
  hoverEffect?: boolean;
}

export const Card = ({
  className,
  variant = 'default',
  children,
  hoverEffect = false,
  ...props
}: CardProps) => {
  const baseClasses = 'rounded-xl overflow-hidden';
  
  const variants = {
    default: 'bg-dark-800 shadow-lg',
    glass: 'glass-card',
    bordered: 'bg-dark-800 border border-primary-500/50 shadow-lg',
    gradient: 'bg-gradient-to-br from-dark-800 to-dark-900 shadow-lg',
  };
  
  const hoverClasses = hoverEffect ? 'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        baseClasses,
        variants[variant],
        hoverClasses,
        className
      )}
      {...props as any}
    >
      {children}
    </motion.div>
  );
};

export const CardHeader = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('px-6 py-5 border-b border-dark-700', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn('text-xl font-semibold', className)}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardContent = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('px-6 py-5', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('px-6 py-4 bg-dark-900/50 flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  );
};
