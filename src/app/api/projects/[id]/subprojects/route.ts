import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/projects/[id]/subprojects - Get child projects
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check access to parent project
        const canAccess = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: { projectId: id, userId: session.user.id },
            });

        if (!canAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const subprojects = await prisma.project.findMany({
            where: { parentId: id },
            select: {
                id: true,
                name: true,
                identifier: true,
                description: true,
                isArchived: true,
                isPublic: true,
                createdAt: true,
                _count: {
                    select: {
                        tasks: true,
                        members: true,
                        children: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json(subprojects);
    } catch (error) {
        console.error('Error fetching subprojects:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/projects/[id]/subprojects - Create a subproject
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check permission to create subproject
        const hasPermission = session.user.isAdministrator ||
            await prisma.projectMember.findFirst({
                where: {
                    projectId: id,
                    userId: session.user.id,
                    role: {
                        permissions: {
                            some: { permission: { key: 'projects.create_subprojects' } },
                        },
                    },
                },
            });

        if (!hasPermission) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, identifier, description, isPublic } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }
        if (!identifier?.trim()) {
            return NextResponse.json({ error: 'Identifier is required' }, { status: 400 });
        }

        // Check identifier uniqueness
        const existingProject = await prisma.project.findUnique({
            where: { identifier: identifier.toLowerCase() },
        });
        if (existingProject) {
            return NextResponse.json({ error: 'Project identifier already exists' }, { status: 400 });
        }

        // Check max nesting level (e.g., 3 levels)
        const parentProject = await prisma.project.findUnique({
            where: { id },
            include: {
                parent: {
                    include: {
                        parent: true,
                    },
                },
            },
        });

        if (!parentProject) {
            return NextResponse.json({ error: 'Parent project not found' }, { status: 404 });
        }

        let nestingLevel = 1;
        if (parentProject.parent) {
            nestingLevel = 2;
            if (parentProject.parent.parent) {
                nestingLevel = 3;
            }
        }

        if (nestingLevel >= 3) {
            return NextResponse.json({ error: 'Maximum nesting level (3) reached' }, { status: 400 });
        }

        // Create subproject
        const subproject = await prisma.project.create({
            data: {
                name: name.trim(),
                identifier: identifier.toLowerCase().trim(),
                description: description?.trim() || null,
                isPublic: isPublic || false,
                parentId: id,
                creatorId: session.user.id,
            },
            include: {
                creator: { select: { id: true, name: true } },
                _count: { select: { tasks: true, members: true } },
            },
        });

        // Optionally inherit members from parent
        const parentMembers = await prisma.projectMember.findMany({
            where: { projectId: id },
        });

        if (parentMembers.length > 0) {
            await prisma.projectMember.createMany({
                data: parentMembers.map(m => ({
                    projectId: subproject.id,
                    userId: m.userId,
                    roleId: m.roleId,
                })),
                skipDuplicates: true,
            });
        }

        return NextResponse.json(subproject, { status: 201 });
    } catch (error) {
        console.error('Error creating subproject:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
