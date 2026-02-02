import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const menuItems = await prisma.menuItem.findMany();
        return NextResponse.json(menuItems);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const newItem = await prisma.menuItem.create({
            data: body,
        });
        return NextResponse.json(newItem);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
    }
}