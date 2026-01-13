import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/queries/[id]
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

        const query = await prisma.query.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true, identifier: true } },
            },
        });

        if (!query) {
            return NextResponse.json({ error: 'Query not found' }, { status: 404 });
        }

        // Check access
        if (!query.isPublic && query.userId !== session.user.id && !session.user.isAdministrator) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({
            ...query,
            filters: JSON.parse(query.filters),
            columns: query.columns ? JSON.parse(query.columns) : null,
        });
    } catch (error) {
        console.error('Error fetching query:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT /api/queries/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const query = await prisma.query.findUnique({ where: { id } });
        if (!query) {
            return NextResponse.json({ error: 'Query not found' }, { status: 404 });
        }

        // Only owner or admin can update
        if (query.userId !== session.user.id && !session.user.isAdministrator) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, isPublic, filters, columns, sortBy, sortOrder, groupBy } = body;

        // Check permission for making public
        if (isPublic && !query.isPublic && !session.user.isAdministrator) {
            return NextResponse.json({ error: 'No permission to make query public' }, { status: 403 });
        }

        const updated = await prisma.query.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(isPublic !== undefined && { isPublic }),
                ...(filters && { filters: JSON.stringify(filters) }),
                ...(columns !== undefined && { columns: columns ? JSON.stringify(columns) : null }),
                ...(sortBy !== undefined && { sortBy }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(groupBy !== undefined && { groupBy }),
            },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({
            ...updated,
            filters: JSON.parse(updated.filters),
            columns: updated.columns ? JSON.parse(updated.columns) : null,
        });
    } catch (error) {
        console.error('Error updating query:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/queries/[id]
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const query = await prisma.query.findUnique({ where: { id } });
        if (!query) {
            return NextResponse.json({ error: 'Query not found' }, { status: 404 });
        }

        // Only owner or admin can delete
        if (query.userId !== session.user.id && !session.user.isAdministrator) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.query.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting query:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
