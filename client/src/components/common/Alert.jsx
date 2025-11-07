import React from 'react';
import styles from './Alert.module.css';

const Alert = ({ type = 'info', message, onClose }) => {
  return (
    <div className={`${styles.alert} ${styles[type]}`}>
      <span className={styles.message}>{message}</span>
      {onClose && (
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
