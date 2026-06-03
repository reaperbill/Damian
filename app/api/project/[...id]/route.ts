import { NextResponse } from 'next/server';
import { getProjectById, getProjects } from '@/lib/projects';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const { personal, school } = await getProjects();
  return [...personal, ...school].map((p) => ({
    id: p.id.split('/'),
  }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string[] }> },
) {
  const { id } = await params;
  const projectId = id.join('/');
  const project = await getProjectById(projectId);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}
