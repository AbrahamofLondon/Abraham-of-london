// components/content/DownloadCTA.jsx
import * as React from "react";
import styles from './DownloadCTA.module.scss';

export default function DownloadCTA({
  title = "Download",
  badge = "Free",
  details = [],
  features = [],
  steps = [],
  buttonText = "Get the Pack",
  onClick,
  href,
}) {
  const handleClick = (e) => {
    if (onClick) return onClick(e);
    if (href) window.location.href = href;
  };

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {badge ? <span className={styles.badge}>{badge}</span> : null}
      </div>

      {details?.length ? (
        <div className={styles.details}>
          {details.map((d, i) => (
            <div className={styles.detailItem} key={i}>
              <div className={styles.detailIcon}>{d.icon ?? "•"}</div>
              <div className={styles.detailText}>
                <span className={styles.detailLabel}>{d.label}</span>
                <span className={styles.detailValue}>{d.value}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {features?.length ? (
        <div className={styles.features}>
          {features.map((f, i) => (
            <div className={styles.featureItem} key={i}>
              <div className={styles.featureIcon}>{f.icon ?? "✓"}</div>
              <div className={styles.featureContent}>
                <p className={styles.featureTitle}>{f.title}</p>
                {f.desc ? <p className={styles.featureDesc}>{f.desc}</p> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {steps?.length ? (
        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div className={styles.step} key={i}>
              <div className={styles.stepNumber}>{i + 1}</div>
              <p className={styles.stepTitle}>{s.title}</p>
              {s.desc ? <p className={styles.stepDesc}>{s.desc}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      <button type="button" className={styles.ctaButton} onClick={handleClick}>
        {buttonText}
      </button>
    </section>
  );
}