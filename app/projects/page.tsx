import type { Metadata } from 'next';
import Projects from '@/components/Projects';
import heroData from '@/data/hero.json';

export const metadata: Metadata = {
  title: 'Projects — Damian Stevenson',
  description: 'All projects by Damian Stevenson',
};

export default function ProjectsPage() {
  return (
    <main>
      {heroData.backgroundImage && (
        <>
          <div
            className="page-bg-fixed"
            style={{ backgroundImage: `url(${heroData.backgroundImage})` }}
          />
          <div className="page-bg-fixed-overlay" />
        </>
      )}

      <div className="hero-container" style={{ position: 'relative', zIndex: 2 }}>
        <Projects showSections />
      </div>
    </main>
  );
}
