import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const { username, itemIds } = await request.json();

        const user = await prisma.user.findUnique({
            where: { name: username },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Calculate total
        const items = await prisma.menuItem.findMany({
            where: {
                id: { in: itemIds },
            },
        });

        const total = items.reduce((sum, item) => sum + item.price, 0);

        const order = await prisma.order.create({
            data: {
                total,
                user: {
                    connect: { id: user.id },
                },
                items: {
                    connect: itemIds.map((id) => ({ id })),
                },
            },
        });

        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: `Failed to create order: ${error.message}` }, { status: 500 });
    }
}
