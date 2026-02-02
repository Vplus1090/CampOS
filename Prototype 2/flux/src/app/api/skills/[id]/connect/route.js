import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request, context) {
    try {
        const { id } = await context.params;
        const { username } = await request.json();

        const user = await prisma.user.findUnique({
            where: { name: username },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const interaction = await prisma.interaction.create({
            data: {
                status: 'PENDING',
                user: {
                    connect: { id: user.id },
                },
                gig: {
                    connect: { id: parseInt(id) },
                },
            },
        });

        return NextResponse.json(interaction);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
    }
}
