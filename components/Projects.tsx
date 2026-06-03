'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProjectSummary } from '@/lib/projects';

const SECTION_ORDER = ['Software', 'Data', 'Tool'] as const;
type SectionName = (typeof SECTION_ORDER)[number];

const CATEGORY_DEFAULT_IMAGE: Record<string, string> = {
  Software: '@/images/default-software.svg',
  Data:     '@/images/default-data.svg',
  Tool:     '@/images/default-tool.svg',
};

function useScrollReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

function ProjectCard({
  project,
  onDetails,
}: {
  project: ProjectSummary;
  onDetails: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollReveal(ref);

  return (
    <div className="project-card" ref={ref}>
      {(() => {
        const img = project.image ?? CATEGORY_DEFAULT_IMAGE[project.category] ?? null;
        return img
          ? (
            <div className="project-image" style={{ position: 'relative', overflow: 'hidden' }}>
              <Image src={img} alt={project.title} fill style={{ objectFit: 'cover' }} />
            </div>
          )
          : <div className="project-image" style={{ background: project.color }} />;
      })()}
      <div className="project-content">
        <h3>{project.title}</h3>
        <p>{project.shortDescription}</p>
        <div className="project-tags">
          <span>{project.category}</span>
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="project-actions">
          <button
            type="button"
            className="project-details-button"
            onClick={() => onDetails(project.id)}
          >
            Project Details
          </button>
          {project.link != null && (
            <a
              className="project-link"
              href={project.link}
              {...(project.openInNewTab ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
            >
              View Project →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectModal({ project, onClose }: { project: ProjectSummary; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="project-details-modal"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="project-details-panel">
        <button type="button" className="project-details-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className="project-details-content">
          <h3>{project.title}</h3>
          <p className="project-detail-category">{project.category}</p>
          <p>{project.description}</p>
          <div className="project-tags">
            {project.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          {project.link != null && (
            <a
              className="project-link"
              href={project.link}
              {...(project.openInNewTab ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
            >
              Open Project →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/** Pick top `perSection` from each category, fill to `limit` by weight. */
function selectBalanced(all: ProjectSummary[], limit: number): ProjectSummary[] {
  const perSection = Math.ceil(limit / SECTION_ORDER.length);
  const picked = new Set<string>();
  const result: ProjectSummary[] = [];

  for (const cat of SECTION_ORDER) {
    const top = all.filter((p) => p.category === cat).slice(0, perSection);
    for (const p of top) {
      if (!picked.has(p.id)) {
        picked.add(p.id);
        result.push(p);
      }
    }
  }

  for (const p of all) {
    if (result.length >= limit) break;
    if (!picked.has(p.id)) result.push(p);
  }

  return result.sort((a, b) => b.weight - a.weight).slice(0, limit);
}

export default function Projects({
  personal,
  school,
  limit,
  showSections,
}: {
  personal: ProjectSummary[];
  school: ProjectSummary[];
  limit?: number;
  showSections?: boolean;
}) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const closeModal = useCallback(() => setActiveModal(null), []);

  const allSorted: ProjectSummary[] = [...personal, ...school].sort(
    (a, b) => b.weight - a.weight || b.lastModified - a.lastModified,
  );

  const displayed = limit ? selectBalanced(allSorted, limit) : allSorted;

  const sectionMap = new Map<SectionName, ProjectSummary[]>();
  if (showSections) {
    for (const cat of SECTION_ORDER) {
      sectionMap.set(cat, allSorted.filter((p) => p.category === cat));
    }
  }

  const activeProject = activeModal ? allSorted.find((p) => p.id === activeModal) ?? null : null;

  const renderGrid = (projects: ProjectSummary[]) => (
    <div className="projects-grid">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} onDetails={setActiveModal} />
      ))}
    </div>
  );

  const renderContent = () => {
    if (showSections) {
      return (
        <>
          {SECTION_ORDER.map((cat) => {
            const projects = sectionMap.get(cat) ?? [];
            if (projects.length === 0) return null;
            return (
              <div key={cat} className="projects-section">
                <h3 className="projects-section-title">{cat}</h3>
                {renderGrid(projects)}
              </div>
            );
          })}
        </>
      );
    }

    return (
      <>
        {renderGrid(displayed)}
        {limit && allSorted.length > limit && (
          <div className="projects-view-all">
            <Link href="/projects" className="view-all-link">
              View All Projects ({allSorted.length}) →
            </Link>
          </div>
        )}
      </>
    );
  };

  return (
    <section id="projects" className="projects">
      <div className="container">
        <h2>{limit ? 'Featured Projects' : 'All Projects'}</h2>
        {renderContent()}
      </div>
      {activeProject && <ProjectModal project={activeProject} onClose={closeModal} />}
    </section>
  );
}
