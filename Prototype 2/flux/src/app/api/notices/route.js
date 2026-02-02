import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const notices = await prisma.notice.findMany({
            orderBy: {
                date: 'desc',
            },
        });
        return NextResponse.json(notices);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const newNotice = await prisma.notice.create({
            data: body,
        });
        return NextResponse.json(newNotice);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
    }
}