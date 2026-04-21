/*
  Warnings:

  - The values [income,expense] on the enum `Entry_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [income,expense] on the enum `Entry_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `category` MODIFY `type` ENUM('INCOME', 'EXPENSE') NOT NULL;

-- AlterTable
ALTER TABLE `entry` MODIFY `type` ENUM('INCOME', 'EXPENSE') NOT NULL;
