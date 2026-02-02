import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Admin
        const admin = await prisma.user.upsert({
            where: { name: 'admin' },
            update: {},
            create: {
                name: 'admin',
                password: '123',
                role: 'ADMIN',
            },
        });

        // Student
        const student = await prisma.user.upsert({
            where: { name: 'student' },
            update: {},
            create: {
                name: 'student',
                password: '123',
                role: 'STUDENT',
            },
        });

        // Seed some menu items for Canteen
        const menuCount = await prisma.menuItem.count();
        if (menuCount === 0) {
            await prisma.menuItem.createMany({
                data: [
                    { name: 'Butter Chicken', price: 180, category: 'Main', available: true },
                    { name: 'Paneer Tikka', price: 150, category: 'Main', available: true },
                    { name: 'Cold Coffee', price: 60, category: 'Beverage', available: true }
                ]
            });
        }

        // Seed Mess Menu for current days
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        for (const day of days) {
            await prisma.messMenu.upsert({
                where: { day },
                update: {},
                create: {
                    day,
                    breakfast: 'Aloo Paratha, Curd',
                    lunch: 'Rice, Dal, Sabzi',
                    dinner: 'Roti, Paneer, Salad'
                }
            });
        }

        return NextResponse.json({ message: 'Seeding successful', admin, student });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
