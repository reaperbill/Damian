import fs from 'fs/promises';
import { watch as fsWatch } from 'fs';
import type { FSWatcher } from 'fs';
import path from 'path';

export interface ProjectSummary {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  color: string;
  image: string | null;
  shortDescription: string;
  link: string | null;
  openInNewTab: boolean;
  lastModified: number;
  weight: number;
}

export interface ProjectDetail {
  id: string;
  title: string;
  category: string;
  tags: string[];
  color: string;
  description: string;
  link: string | null;
  openInNewTab: boolean;
  lastModified: number;
}

interface ProjectMetadata {
  projectPath?: string;
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
}

interface InternalProject {
  id: string;
  title: string;
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

const projectDefaults = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
];

const codeExtensions = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs',
  '.go', '.rb', '.php', '.html', '.css', '.swift', '.sh', '.bash', '.ipynb', '.sql', '.twb',
]);

async function collectMetadataFiles(dir: string): Promise<string[]> {
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
      files.push(...(await collectMetadataFiles(child)));
    } else if (d.isFile() && d.name.toLowerCase().endsWith('.json')) {
      files.push(child);
    }
  }
  return files;
}

async function hasCodeFiles(target: string): Promise<boolean> {
  try {
    const stat = await fs.stat(target);
    if (stat.isFile()) return codeExtensions.has(path.extname(target).toLowerCase());
    if (!stat.isDirectory()) return false;
    const dirents = await fs.readdir(target, { withFileTypes: true });
    for (const d of dirents) {
      const child = path.join(target, d.name);
      if (d.isFile() && codeExtensions.has(path.extname(d.name).toLowerCase())) return true;
      if (d.isDirectory() && (await hasCodeFiles(child))) return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function loadCategory(
  metadataRoot: string,
  folderRoot: string,
  categoryLabel: string,
): Promise<InternalProject[]> {
  const metadataFiles = await collectMetadataFiles(metadataRoot);
  const projects: InternalProject[] = [];

  for (const metaPath of metadataFiles) {
    let meta: ProjectMetadata;
    try {
      meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    } catch {
      continue;
    }

    const projectPath = meta.projectPath
      ? path.normalize(meta.projectPath)
      : path.basename(metaPath, '.json');
    const absolute = path.resolve(folderRoot, projectPath);
    const relative = path
      .relative(folderRoot, absolute)
      .split(path.sep)
      .join('/');

    if (relative.startsWith('..') || relative === '') continue;

    const hasCode = await hasCodeFiles(absolute);
    const hasExplicitCategory = typeof meta.category === 'string';
    const hasLink = 'link' in meta && !!meta.link;

    if (!hasCode) {
      // No local code — include only if the JSON has an explicit category or link.
      // Use the JSON file's location to assign it to the correct loadCategory pass.
      if (!hasExplicitCategory && !hasLink) continue;
      const sep = path.sep;
      const inSchool =
        metaPath.includes(`${sep}College${sep}`) ||
        metaPath.includes(`${sep}Flatiron${sep}School${sep}`);
      const inPersonal =
        metaPath.includes(`${sep}projects${sep}`) ||
        metaPath.includes(`${sep}Flatiron${sep}Projects${sep}`);
      if (categoryLabel === 'School' && !inSchool) continue;
      if (categoryLabel === 'Personal' && !inPersonal) continue;
    }

    let lastModified = 0;
    try {
      const stat = await fs.stat(absolute);
      lastModified = stat.mtimeMs;
    } catch {
      lastModified = 0;
    }

    // JSON `category` (Data/Software/Tool) takes precedence over path-derived label
    const category = hasExplicitCategory ? (meta.category as string) : categoryLabel;
    const title = meta.title ?? path.basename(absolute);
    const description = meta.description ?? `A ${category} project.`;
    const shortDescription = meta.shortDescription ?? description;
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    const color = meta.color ?? projectDefaults[projects.length % projectDefaults.length];
    const openInNewTab = meta.openInNewTab !== false;
    const link = 'link' in meta ? (meta.link ?? null) : null;
    const weight = typeof meta.weight === 'number' ? meta.weight : 50;
    const subcategory = typeof meta.subcategory === 'string' ? meta.subcategory : null;
    const image = typeof meta.image === 'string' && meta.image ? meta.image : null;

    projects.push({
      id: relative,
      title,
      category,
      subcategory,
      shortDescription,
      description,
      tags,
      color,
      image,
      link,
      openInNewTab,
      lastModified,
      weight,
    });
  }

  return projects.sort((a, b) => b.weight - a.weight || b.lastModified - a.lastModified);
}

async function buildCache(): Promise<ProjectCache> {
  const root = path.join(process.cwd(), '..');
  const projectsRoot = path.join(root, 'Projects');
  const schoolRoot = path.join(root, 'School');
  const metadataDir = path.join(process.cwd(), 'data', 'projects-json');

  const [personal, school] = await Promise.all([
    loadCategory(metadataDir, projectsRoot, 'Personal'),
    loadCategory(metadataDir, schoolRoot, 'School'),
  ]);

  const byId: Record<string, InternalProject> = {};
  for (const p of [...personal, ...school]) byId[p.id] = p;

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
    // File watching unavailable in this environment — cache persists until restart
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
    category: p.category,
    subcategory: p.subcategory,
    tags: p.tags,
    color: p.color,
    image: p.image,
    shortDescription: p.shortDescription,
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
    category: p.category,
    tags: p.tags,
    color: p.color,
    description: p.description,
    link: p.link,
    openInNewTab: p.openInNewTab,
    lastModified: p.lastModified,
  };
}
