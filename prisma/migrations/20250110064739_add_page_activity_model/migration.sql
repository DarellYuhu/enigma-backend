-- CreateTable
CREATE TABLE "PageActivity" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "operations" INTEGER NOT NULL,

    CONSTRAINT "PageActivity_pkey" PRIMARY KEY ("id")
);
