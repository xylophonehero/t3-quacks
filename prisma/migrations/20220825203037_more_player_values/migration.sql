/*
  Warnings:

  - You are about to drop the column `board` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `exploded` on the `Player` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "board",
DROP COLUMN "exploded",
ADD COLUMN     "dropletValue" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "ratValue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rubies" INTEGER NOT NULL DEFAULT 0;
