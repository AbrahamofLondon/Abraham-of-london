import React from "react";
import PropTypes from "prop-types";
import "./HeroBanner.css";

const HeroBanner = ({
  title,
  subtitle,
  backgroundImage,
  overlayOpacity = 0.4,
  height = "70vh",
  textAlign = "center",
  ctaText,
  ctaOnClick,
  children,
}) => {
  const bannerStyle = {
    backgroundImage: `url(${backgroundImage})`,
    height: height,
  };

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
  };

  const contentStyle = {
    textAlign: textAlign,
  };

  return (
    <section className="hero-banner" style={bannerStyle}>
      <div className="hero-overlay" style={overlayStyle}></div>
      <div className="hero-content" style={contentStyle}>
        <h1 className="hero-title">{title}</h1>
        {subtitle && <p className="hero-subtitle">{subtitle}</p>}
        {ctaText && (
          <button className="hero-cta" onClick={ctaOnClick}>
            {ctaText}
          </button>
        )}
        {children}
      </div>
    </section>
  );
};

HeroBanner.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  backgroundImage: PropTypes.string.isRequired,
  overlayOpacity: PropTypes.number,
  height: PropTypes.string,
  textAlign: PropTypes.oneOf(["left", "center", "right"]),
  ctaText: PropTypes.string,
  ctaOnClick: PropTypes.func,
  children: PropTypes.node,
};

export default HeroBanner;
