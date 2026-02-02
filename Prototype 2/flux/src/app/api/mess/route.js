import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const messMenu = await prisma.messMenu.findMany();
        // Format into object keyed by day
        const formattedMenu = messMenu.reduce((acc, item) => {
            acc[item.day] = item;
            return acc;
        }, {});

        return NextResponse.json(formattedMenu);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch mess menu' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const newMenu = await prisma.messMenu.create({
            data: body,
        });
        return NextResponse.json(newMenu);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create mess menu' }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const { day, type, value } = await request.json();

        // type should be 'breakfast', 'lunch', or 'dinner'
        const updatedMenu = await prisma.messMenu.update({
            where: { day },
            data: {
                [type]: value
            }
        });

        return NextResponse.json(updatedMenu);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update mess menu' }, { status: 500 });
    }
}