import React from 'react';

import { IconProps } from './types';

export const RouteIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M7 7h7a5 5 0 0 1 0 10h-2" />
    <circle cx="5" cy="7" r="2" />
    <circle cx="16" cy="17" r="2" />
    <path d="M5 9v10" />
  </svg>
);






