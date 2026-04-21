/*
  Warnings:

  - The values [INCOME,EXPENSE] on the enum `Entry_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [INCOME,EXPENSE] on the enum `Entry_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `category` MODIFY `type` ENUM('income', 'expense') NOT NULL;

-- AlterTable
ALTER TABLE `entry` MODIFY `type` ENUM('income', 'expense') NOT NULL;
