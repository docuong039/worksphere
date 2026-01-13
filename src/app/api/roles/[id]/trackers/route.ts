import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/roles/[id]/trackers - Get trackers assigned to a role
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

        const roleTrackers = await prisma.roleTracker.findMany({
            where: { roleId: id },
            include: {
                tracker: {
                    select: {
                        id: true,
                        name: true,
                        position: true,
                    },
                },
            },
            orderBy: { tracker: { position: 'asc' } },
        });

        return NextResponse.json(roleTrackers.map(rt => rt.tracker));
    } catch (error) {
        console.error('Error fetching role trackers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT /api/roles/[id]/trackers - Update trackers for a role
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.isAdministrator) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const { trackerIds } = await request.json();

        if (!Array.isArray(trackerIds)) {
            return NextResponse.json({ error: 'trackerIds must be an array' }, { status: 400 });
        }

        // Verify role exists
        const role = await prisma.role.findUnique({ where: { id } });
        if (!role) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 });
        }

        // Transaction: delete existing and create new
        await prisma.$transaction(async (tx) => {
            // Delete existing
            await tx.roleTracker.deleteMany({
                where: { roleId: id },
            });

            // Create new
            if (trackerIds.length > 0) {
                await tx.roleTracker.createMany({
                    data: trackerIds.map((trackerId: string) => ({
                        roleId: id,
                        trackerId,
                    })),
                    skipDuplicates: true,
                });
            }
        });

        // Return updated list
        const updated = await prisma.roleTracker.findMany({
            where: { roleId: id },
            include: { tracker: true },
        });

        return NextResponse.json(updated.map(rt => rt.tracker));
    } catch (error) {
        console.error('Error updating role trackers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
