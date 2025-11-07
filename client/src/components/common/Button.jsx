import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const className = `${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${disabled || loading ? styles.disabled : ''}`;
  
  return (
    <button 
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
