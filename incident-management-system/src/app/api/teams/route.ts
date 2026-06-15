import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-utils';

export const POST = withAuth(async (request, { decoded, body }) => {
  try {
    const { name, projectId } = (body as { name?: string; projectId?: string }) || {};

    if (!name || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the project belongs to the user's org.
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.orgId !== decoded.orgId) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Managers can only create teams in their own project
    if (decoded.role === 'MANAGER' && decoded.projectId !== projectId) {
      return NextResponse.json({ error: 'Managers can only create teams in their assigned project' }, { status: 403 });
    }

    const team = await prisma.team.create({
      data: {
        name,
        projectId
      }
    });

    return NextResponse.json({
      message: 'Team created successfully',
      team
    }, { status: 201 });

  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN', 'MANAGER']);
