import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const feedbacks = await prisma.feedback.findMany({
            include: {
                user: {
                    select: { name: true } // Optionally include user name
                }
            }
        });
        return NextResponse.json(feedbacks);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { username, type, message } = await request.json();

        const user = await prisma.user.findUnique({
            where: { name: username },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const feedback = await prisma.feedback.create({
            data: {
                type,
                message,
                user: {
                    connect: { id: user.id },
                },
            },
        });

        return NextResponse.json(feedback);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 });
    }
}
