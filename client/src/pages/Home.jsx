import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import styles from './Home.module.css';

const Home = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    // Parallax effect on scroll
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    };

    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible);
        }
      });
    }, observerOptions);

    // Observe all feature cards
    const featureCards = document.querySelectorAll(`.${styles.featureCard}`);
    featureCards.forEach(card => observer.observe(card));

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // Mouse move 3D effect
  const handleMouseMove = (e) => {
    const cards = document.querySelectorAll(`.${styles.card3d}`);
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
  };

  const handleMouseLeave = (e) => {
    const cards = document.querySelectorAll(`.${styles.card3d}`);
    cards.forEach(card => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  };

  return (
    <div className={styles.home}>
      {/* Animated Background */}
      <div className={styles.backgroundAnimation}>
        <div className={styles.shape1}></div>
        <div className={styles.shape2}></div>
        <div className={styles.shape3}></div>
        <div className={styles.shape4}></div>
      </div>

      {/* Hero Section */}
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              <span className={styles.gradientText}>PropertyHub</span>
              <br />
              Modern Property Management
            </h1>
            <p className={styles.heroSubtitle}>
              Streamline your rental business with AI-powered property management. 
              Handle leases, payments, and maintenance all in one place.
            </p>
            <div className={styles.heroCta}>
              <Button 
                size="large" 
                onClick={() => navigate('/register')}
                className={styles.ctaPrimary}
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                size="large" 
                onClick={() => navigate('/login')}
                className={styles.ctaSecondary}
              >
                Sign In
              </Button>
            </div>
          </div>
          
          <div className={styles.hero3d}>
            <div className={styles.floatingCard} style={{ animationDelay: '0s' }}>
              <div className={styles.cardIcon}>🏠</div>
              <div className={styles.cardText}>
                <div className={styles.cardTitle}>Properties</div>
                <div className={styles.cardValue}>1,234</div>
              </div>
            </div>
            <div className={styles.floatingCard} style={{ animationDelay: '0.5s' }}>
              <div className={styles.cardIcon}>💰</div>
              <div className={styles.cardText}>
                <div className={styles.cardTitle}>Revenue</div>
                <div className={styles.cardValue}>₹25.4M</div>
              </div>
            </div>
            <div className={styles.floatingCard} style={{ animationDelay: '1s' }}>
              <div className={styles.cardIcon}>👥</div>
              <div className={styles.cardText}>
                <div className={styles.cardTitle}>Tenants</div>
                <div className={styles.cardValue}>5,678</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} ref={featuresRef}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Powerful Features</h2>
          <p className={styles.sectionSubtitle}>Everything you need to manage properties efficiently</p>
        </div>

        <div className={styles.featuresGrid} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <div className={`${styles.featureCard} ${styles.card3d}`}>
            <div className={styles.featureIcon}>🏢</div>
            <h3 className={styles.featureTitle}>Property Management</h3>
            <p className={styles.featureDesc}>
              Add, edit, and organize all your properties with detailed information, photos, and availability status.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.card3d}`}>
            <div className={styles.featureIcon}>📄</div>
            <h3 className={styles.featureTitle}>Digital Lease Agreements</h3>
            <p className={styles.featureDesc}>
              Create, sign, and manage lease agreements digitally with electronic signatures and automatic renewals.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.card3d}`}>
            <div className={styles.featureIcon}>💳</div>
            <h3 className={styles.featureTitle}>Automated Payments</h3>
            <p className={styles.featureDesc}>
              Automatic rent collection with payment reminders, late fee calculations, and receipt generation.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.card3d}`}>
            <div className={styles.featureIcon}>🔧</div>
            <h3 className={styles.featureTitle}>Maintenance Requests</h3>
            <p className={styles.featureDesc}>
              Track and manage maintenance requests with photo uploads, priority levels, and real-time status updates.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.card3d}`}>
            <div className={styles.featureIcon}>💬</div>
            <h3 className={styles.featureTitle}>Real-time Messaging</h3>
            <p className={styles.featureDesc}>
              Communicate with tenants instantly with file attachments, message reactions, and read receipts.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.card3d}`}>
            <div className={styles.featureIcon}>📊</div>
            <h3 className={styles.featureTitle}>Analytics Dashboard</h3>
            <p className={styles.featureDesc}>
              Track revenue, occupancy rates, and payment history with beautiful charts and insights.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>10K+</div>
            <div className={styles.statLabel}>Properties Managed</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>50K+</div>
            <div className={styles.statLabel}>Active Users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>₹500M+</div>
            <div className={styles.statLabel}>Rent Collected</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>99.9%</div>
            <div className={styles.statLabel}>Uptime</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Transform Your Property Management?</h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of landlords who trust PropertyHub for their rental business
          </p>
          <div className={styles.ctaButtons}>
            <Button 
              size="large" 
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline" 
              size="large" 
              onClick={() => window.open('https://docs.propertyhub.com', '_blank')}
            >
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3 className={styles.footerTitle}>PropertyHub</h3>
            <p className={styles.footerDesc}>
              Modern property management solution for the digital age.
            </p>
          </div>
          <div className={styles.footerSection}>
            <h4 className={styles.footerHeading}>Product</h4>
            <ul className={styles.footerLinks}>
              <li>Features</li>
              <li>Pricing</li>
              <li>Security</li>
              <li>Updates</li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4 className={styles.footerHeading}>Company</h4>
            <ul className={styles.footerLinks}>
              <li>About</li>
              <li>Blog</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>
          <div className={styles.footerSection}>
            <h4 className={styles.footerHeading}>Legal</h4>
            <ul className={styles.footerLinks}>
              <li>Privacy</li>
              <li>Terms</li>
              <li>Cookies</li>
              <li>Licenses</li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2025 PropertyHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
