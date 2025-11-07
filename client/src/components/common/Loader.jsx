import React from 'react';
import styles from './Loader.module.css';

const Loader = ({ fullScreen = false, size = 'md' }) => {
  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        <div className={`${styles.spinner} ${styles[size]}`}></div>
      </div>
    );
  }

  return <div className={`${styles.spinner} ${styles[size]}`}></div>;
};

export default Loader;
