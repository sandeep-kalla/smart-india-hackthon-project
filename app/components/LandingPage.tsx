import React from 'react';
import styles from './LandingPage.module.css';
import { WiDaySunny, WiCloud, WiRaindrops, WiSnowflakeCold, WiThunderstorm, WiWindy } from 'react-icons/wi';

const LandingPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.gradientOverlay}></div>
        <div className={styles.lensFlare}></div>
      </div>
      <h1 className={styles.heading}>
        <div className={styles.titleContainer}>
          <span className={styles.weather}>Weather</span>
          <span className={styles.wonder}>Wonder</span>
          <div className={styles.iconContainer}>
            <WiDaySunny className={`${styles.weatherIcon} ${styles.sunIcon}`} />
            <WiCloud className={`${styles.weatherIcon} ${styles.cloudIcon}`} />
            <WiRaindrops className={`${styles.weatherIcon} ${styles.rainIcon}`} />
            <WiSnowflakeCold className={`${styles.weatherIcon} ${styles.snowIcon}`} />
            <WiThunderstorm className={`${styles.weatherIcon} ${styles.thunderIcon}`} />
            <WiWindy className={`${styles.weatherIcon} ${styles.windIcon}`} />
          </div>
        </div>
      </h1>
      {/* Rest of your landing page content */}
    </div>
  );
};

export default LandingPage;