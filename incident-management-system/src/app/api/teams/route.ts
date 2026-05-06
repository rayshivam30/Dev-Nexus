import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-utils';

export const POST = withAuth(async (request, { decoded, body }) => {
  try {
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, projectId } = (body as { name?: string; projectId?: string }) || {};

    if (!name || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify if the project belongs to the user's org.
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.orgId !== decoded.orgId) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
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
});
