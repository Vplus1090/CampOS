import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch gigs with reports > 0, ordered by report count descending
        const reportedGigs = await prisma.skillGig.findMany({
            where: {
                reports: {
                    gt: 0,
                },
            },
            orderBy: {
                reports: 'desc',
            },
            include: {
                interactions: true,
            },
        });

        return NextResponse.json(reportedGigs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
