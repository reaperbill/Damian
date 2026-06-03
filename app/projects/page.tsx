import type { Metadata } from 'next';
import Image from 'next/image';
import { getProjects } from '@/lib/projects';
import Projects from '@/components/Projects';
import heroData from '@/data/hero.json';

export const metadata: Metadata = {
  title: 'Projects — Damian Stevenson',
  description: 'All projects by Damian Stevenson',
};

export default async function ProjectsPage() {
  const { personal, school } = await getProjects();
  return (
    <main>
      {heroData.backgroundImage && (
        <>
          <div className="page-bg-fixed">
            <Image
              src={heroData.backgroundImage}
              alt=""
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <div className="page-bg-fixed-overlay" />
        </>
      )}

      <div className="hero-container" style={{ position: 'relative', zIndex: 2 }}>
        <Projects personal={personal} school={school} showSections />
      </div>
    </main>
  );
}
