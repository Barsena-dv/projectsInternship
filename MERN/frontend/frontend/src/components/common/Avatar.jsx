import React, { useState } from 'react';

const getInitials = (name = '') => {
  const cleanName = String(name).trim();
  if (!cleanName) return '??';
  
  const parts = cleanName.split(/\s+/).filter(Boolean);
  
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  
  if (cleanName.length >= 2) {
    return cleanName.substring(0, 2).toUpperCase();
  }
  
  return cleanName.toUpperCase() || '?';
};

const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;
  const showInitials = !src || imgError;

  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-full bg-stone-950 border-2 border-white/10 shrink-0 overflow-hidden ${selectedSize} ${className}`}
      title={name}
    >
      {src && !imgError && (
        <img
          src={src}
          alt={name || 'User Avatar'}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      )}
      
      {showInitials && (
        <div className="absolute inset-0 flex items-center justify-center font-black text-amber-500 bg-stone-900 uppercase tracking-tight">
          {getInitials(name)}
        </div>
      )}

      {/* Subtle overlay glow */}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_0_8px_rgba(255,255,255,0.05)] pointer-events-none" />
    </div>
  );
};

export default Avatar;
