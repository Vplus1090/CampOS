import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const skills = await prisma.skillGig.findMany({
            include: {
                interactions: true,
            },
        });
        return NextResponse.json(skills);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { username, ...gigData } = await request.json();

        const user = await prisma.user.findUnique({
            where: { name: username },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const newGig = await prisma.skillGig.create({
            data: {
                ...gigData,
                student: {
                    connect: { id: user.id },
                },
            },
        });

        return NextResponse.json(newGig);
    } catch (error) {
        return NextResponse.json({ error: `Failed to create skill gig: ${error.message}` }, { status: 500 });
    }
}