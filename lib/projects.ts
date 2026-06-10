import fs from 'fs/promises';
import { watch as fsWatch } from 'fs';
import type { FSWatcher } from 'fs';
import path from 'path';

export interface ProjectSummary {
  id: string;
  title: string;
  type: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  color: string;
  image: string | null;
  shortDescription: string;
  description: string;
  link: string | null;
  openInNewTab: boolean;
  lastModified: number;
  weight: number;
}

export interface ProjectDetail {
  id: string;
  title: string;
  type: string;
  category: string;
  tags: string[];
  color: string;
  description: string;
  link: string | null;
  openInNewTab: boolean;
  lastModified: number;
}

interface ProjectMetadata {
  title?: string;
  description?: string;
  shortDescription?: string;
  tags?: string[];
  color?: string;
  image?: string | null;
  link?: string | null;
  openInNewTab?: boolean;
  weight?: number;
  subcategory?: string;
  category?: string;
  type?: string;
}

interface InternalProject {
  id: string;
  title: string;
  type: string;
  category: string;
  subcategory: string | null;
  shortDescription: string;
  description: string;
  tags: string[];
  color: string;
  image: string | null;
  link: string | null;
  openInNewTab: boolean;
  lastModified: number;
  weight: number;
}

interface ProjectCache {
  personal: InternalProject[];
  school: InternalProject[];
  byId: Record<string, InternalProject>;
}

declare global {
  // eslint-disable-next-line no-var
  var _portfolioCache: ProjectCache | undefined;
  // eslint-disable-next-line no-var
  var _portfolioWatcher: FSWatcher | undefined;
}

const COLOR_DEFAULTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
];

async function collectJsonFiles(dir: string): Promise<string[]> {
  let dirents;
  try {
    dirents = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const d of dirents) {
    const child = path.join(dir, d.name);
    if (d.isDirectory()) {
      files.push(...(await collectJsonFiles(child)));
    } else if (d.isFile() && d.name.toLowerCase().endsWith('.json')) {
      files.push(child);
    }
  }
  return files;
}

async function buildCache(): Promise<ProjectCache> {
  const metadataDir = path.join(process.cwd(), 'data', 'projects-json');
  const jsonFiles = await collectJsonFiles(metadataDir);

  const personal: InternalProject[] = [];
  const school: InternalProject[] = [];
  const byId: Record<string, InternalProject> = {};
  let colorIndex = 0;

  for (const filePath of jsonFiles) {
    let meta: ProjectMetadata;
    try {
      meta = JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch {
      continue;
    }

    const id = path.basename(filePath, '.json');

    const sep = path.sep;
    const isSchool =
      filePath.includes(`${sep}College${sep}`) ||
      filePath.includes(`${sep}Flatiron${sep}School${sep}`);

    const categoryLabel = isSchool ? 'School' : 'Personal';
    const category = typeof meta.category === 'string' ? meta.category : categoryLabel;
    const type = typeof meta.type === 'string' ? meta.type : categoryLabel;
    const title = meta.title ?? id;
    const description = meta.description ?? `A ${category} project.`;
    const shortDescription = meta.shortDescription ?? description;

    const project: InternalProject = {
      id,
      title,
      type,
      category,
      subcategory: typeof meta.subcategory === 'string' ? meta.subcategory : null,
      shortDescription,
      description,
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      color: meta.color ?? COLOR_DEFAULTS[colorIndex % COLOR_DEFAULTS.length],
      image: typeof meta.image === 'string' && meta.image ? meta.image : null,
      link: 'link' in meta ? (meta.link ?? null) : null,
      openInNewTab: meta.openInNewTab !== false,
      lastModified: 0,
      weight: typeof meta.weight === 'number' ? meta.weight : 50,
    };

    colorIndex++;
    byId[id] = project;
    if (type === 'School') {
      school.push(project);
    } else {
      personal.push(project);
    }
  }

  const byWeight = (a: InternalProject, b: InternalProject) => b.weight - a.weight;
  personal.sort(byWeight);
  school.sort(byWeight);

  return { personal, school, byId };
}

function ensureWatcher(): void {
  if (global._portfolioWatcher) return;
  const metadataDir = path.join(process.cwd(), 'data', 'projects-json');
  try {
    global._portfolioWatcher = fsWatch(metadataDir, { recursive: true }, () => {
      global._portfolioCache = undefined;
    });
  } catch {
    // file watching unavailable in this environment
  }
}

async function getCache(): Promise<ProjectCache> {
  ensureWatcher();
  if (!global._portfolioCache) {
    global._portfolioCache = await buildCache();
  }
  return global._portfolioCache;
}

export async function getProjects(): Promise<{
  personal: ProjectSummary[];
  school: ProjectSummary[];
}> {
  const { personal, school } = await getCache();
  return {
    personal: personal.map(toSummary),
    school: school.map(toSummary),
  };
}

export async function getProjectById(id: string): Promise<ProjectDetail | null> {
  const { byId } = await getCache();
  const p = byId[id];
  return p ? toDetail(p) : null;
}

function toSummary(p: InternalProject): ProjectSummary {
  return {
    id: p.id,
    title: p.title,
    type: p.type,
    category: p.category,
    subcategory: p.subcategory,
    tags: p.tags,
    color: p.color,
    image: p.image,
    shortDescription: p.shortDescription,
    description: p.description,
    link: p.link,
    openInNewTab: p.openInNewTab,
    lastModified: p.lastModified,
    weight: p.weight,
  };
}

function toDetail(p: InternalProject): ProjectDetail {
  return {
    id: p.id,
    title: p.title,
    type: p.type,
    category: p.category,
    tags: p.tags,
    color: p.color,
    description: p.description,
    link: p.link,
    openInNewTab: p.openInNewTab,
    lastModified: p.lastModified,
  };
}
