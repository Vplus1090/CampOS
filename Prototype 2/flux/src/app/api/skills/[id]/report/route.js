import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request, context) {
    try {
        const { id } = await context.params;
        const gigId = parseInt(id);

        const updatedGig = await prisma.skillGig.update({
            where: { id: gigId },
            data: {
                reports: {
                    increment: 1,
                },
            },
        });

        return NextResponse.json(updatedGig);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to report gig' }, { status: 500 });
    }
}
