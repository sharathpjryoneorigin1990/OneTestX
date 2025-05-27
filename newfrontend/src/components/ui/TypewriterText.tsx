"use client";

import React from 'react';
import { TypeAnimation } from 'react-type-animation';
import { cn } from '@/utils/cn';

interface TypewriterTextProps {
  sequences: (string | number)[];
  className?: string;
  speed?: number;
  repeat?: number;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  sequences,
  className,
  speed = 50,
  repeat = Infinity,
}) => {
  return (
    <TypeAnimation
      sequence={sequences}
      wrapper="span"
      speed={{ type: 'keyStrokeDelayInMs', value: speed }}
      repeat={repeat}
      className={cn('font-medium', className)}
    />
  );
};
