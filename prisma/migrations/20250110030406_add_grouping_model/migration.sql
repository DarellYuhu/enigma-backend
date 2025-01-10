-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPage" (
    "groupId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupPage_groupId_pageId_key" ON "GroupPage"("groupId", "pageId");

-- AddForeignKey
ALTER TABLE "GroupPage" ADD CONSTRAINT "GroupPage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPage" ADD CONSTRAINT "GroupPage_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
