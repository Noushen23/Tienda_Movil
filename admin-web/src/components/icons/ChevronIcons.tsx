import React from 'react'
import { IconProps } from '../icons/types'

export const ChevronLeftIcon: React.FC<IconProps> = ({ 
  size = 24, 
  className = '', 
  ...props 
}) => (
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
    <polyline points="15,18 9,12 15,6" />
  </svg>
)

export const ChevronRightIcon: React.FC<IconProps> = ({ 
  size = 24, 
  className = '', 
  ...props 
}) => (
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
    <polyline points="9,18 15,12 9,6" />
  </svg>
)
