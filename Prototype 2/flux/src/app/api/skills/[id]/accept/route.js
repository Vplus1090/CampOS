import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request, context) {
    try {
        const { id } = await context.params;
        const { username } = await request.json();
        const gigId = parseInt(id);

        // Find the interaction for this user and gig
        // Since we need to find interaction by user name and gig ID, we first find the user
        // or we can try updating many where user.name matches if prisma supports it in updateMany relation filter (it doesn't directly support deep relation filter in updateMany easily without verification).
        // Safest is to find user first.

        const user = await prisma.user.findUnique({
            where: { name: username },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update the interaction
        await prisma.interaction.updateMany({
            where: {
                gigId: gigId,
                userId: user.id,
            },
            data: {
                status: 'ACCEPTED',
            },
        });

        return NextResponse.json({ message: 'Interaction accepted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to accept interaction' }, { status: 500 });
    }
}
