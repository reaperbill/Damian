'use client';

import { useEffect, useRef } from 'react';
import aboutData from '@/data/about.json';

export default function About() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tags = Array.from(gridRef.current?.querySelectorAll('.skill-tag') ?? []);
    if (!tags.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'scale(1)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    tags.forEach((tag, i) => {
      const el = tag as HTMLElement;
      el.style.opacity = '0';
      el.style.transform = 'scale(0.8)';
      el.style.transition = `opacity 0.4s ease ${i * 50}ms, transform 0.4s ease ${i * 50}ms`;
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="about">
      <div className="container">
        <h2>About Me</h2>
        <div className="about-content">
          <div className="about-text">
            {aboutData.bio.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            <div className="skills-list">
              <h3>Skills</h3>
              <div className="skills-grid" ref={gridRef}>
                {aboutData.skills.map((skill) => (
                  <span key={skill} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
