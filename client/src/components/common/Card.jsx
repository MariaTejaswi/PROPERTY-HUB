import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, title, actions, className = '', hover = true }) => {
  return (
    <div className={`${styles.card} ${hover ? styles.hover : ''} ${className}`}>
      {title && (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default Card;
