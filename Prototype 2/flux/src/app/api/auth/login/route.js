import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        const user = await prisma.user.findFirst({
            where: {
                name: {
                    equals: username,
                    mode: 'insensitive'
                }
            },
        });

        if (user && user.password === password) {
            // Return user excluding password
            const { password: _, ...userWithoutPassword } = user;
            return NextResponse.json(userWithoutPassword);
        }

        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
