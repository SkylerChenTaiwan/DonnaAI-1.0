/**
 * 動態圖示元件
 * 根據名稱載入對應的圖示
 */

import React from 'react';
import { iconMap, IconName } from './icons';
import { cn } from '@/lib/utils';

interface IconProps {
  name: IconName;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export function Icon({ 
  name, 
  className, 
  size = 'md',
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = !ariaLabel,
}: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }
  
  return (
    <IconComponent
      className={cn(sizeClasses[size], className)}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    />
  );
}

// 便利的圖示元件，提供更好的 TypeScript 支援
export function DynamicIcon(props: IconProps) {
  return <Icon {...props} />;
}

// 預設導出
export default Icon;