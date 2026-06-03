'use client';

import { useMemo } from 'react';
import heroData from '@/data/hero.json';

// drdsteven2000@gmail.com encoded as char codes
const E = [100,114,100,115,116,101,118,101,110,50,48,48,48,64,103,109,97,105,108,46,99,111,109];

export default function Contact() {
  const gmailLink = useMemo(() => {
    const addr = String.fromCharCode(...E);
    return `https://mail.google.com/mail/?view=cm&to=${addr}`;
  }, []);

  const bgImage = heroData.backgroundImage;

  return (
    <section id="contact" className="contact">
      {bgImage && (
        <>
          <div className="contact-bg" style={{ backgroundImage: `url(${bgImage})` }} />
          <div className="hero-overlay" />
        </>
      )}

      <div className="contact-container">
        <h2>Get In Touch</h2>
        <p className="contact-subtitle">Have a question or want to work together? Reach out.</p>

        <div className="contact-actions">
          <a href={gmailLink} target="_blank" rel="noreferrer noopener" className="contact-email-btn">
            Email Me
          </a>
        </div>

        <div className="social-links">
          <h3>Connect With Me</h3>
          <div className="social-icons">
            <a href="https://github.com/reaperbill" target="_blank" rel="noreferrer noopener">
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/damianrstevenson/" target="_blank" rel="noreferrer noopener">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
