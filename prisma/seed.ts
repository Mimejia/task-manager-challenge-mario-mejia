import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.roles.upsert({
        where: { code: "admin" },
        update: { name: "Administrador" },
        create: { code: "admin", name: "Administrador" },
    });

    await prisma.roles.upsert({
        where: { code: "user" },
        update: { name: "Usuario" },
        create: { code: "user", name: "Usuario" },
    });
}

main()
    .then(async () => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });