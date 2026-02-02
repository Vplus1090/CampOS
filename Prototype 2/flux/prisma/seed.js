const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const students = [
    'Vardaan',
    'Kunal',
    'Ripunjay',
    'Krish',
    'Dhruv',
    'Shambhavi'
];

async function main() {
    console.log('Start seeding ...');
    for (const name of students) {
        const password = `${name}@123`;
        const user = await prisma.user.upsert({
            where: { name: name },
            update: {},
            create: {
                name: name,
                password: password,
                role: 'STUDENT',
            },
        });
        console.log(`Created user: ${user.name} with password: ${password}`);
    }
    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
