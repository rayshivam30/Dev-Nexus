import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, projectId } = await request.json();

    if (!name || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // A real app would also verify if the project belongs to the user's org.
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
}
