import { app } from "./app";
import { config } from "./config";
import { prisma } from "./prisma";

const start = async () => {
  await prisma.$connect();
  app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
  });
};

start();