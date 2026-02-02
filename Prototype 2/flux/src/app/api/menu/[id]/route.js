import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request, context) {
    try {
        const { id } = await context.params;
        const { available } = await request.json();

        const updatedItem = await prisma.menuItem.update({
            where: { id: parseInt(id) },
            data: { available },
        });

        return NextResponse.json(updatedItem);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(request, context) {
    try {
        const { id } = await context.params;

        await prisma.menuItem.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: 'Item deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
