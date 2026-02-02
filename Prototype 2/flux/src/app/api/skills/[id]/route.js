import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request, context) {
    try {
        const { id } = await context.params;
        const gigId = parseInt(id);

        // Delete related interactions first
        await prisma.interaction.deleteMany({
            where: { gigId: gigId },
        });

        // Delete the gig
        await prisma.skillGig.delete({
            where: { id: gigId },
        });

        return NextResponse.json({ message: 'Skill gig deleted' });
    } catch (error) {
        return NextResponse.json({ error: `Failed to delete skill gig: ${error.message}` }, { status: 500 });
    }
}
