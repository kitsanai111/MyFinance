-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin', 'superadmin');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('income', 'expense');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "ipAddress" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" NOT NULL DEFAULT 'user',
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EntryType" NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "userId" INTEGER,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "EntryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "source" TEXT,
    "total" DOUBLE PRECISION,
    "income_total" DOUBLE PRECISION,
    "expense_total" DOUBLE PRECISION,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxLimit" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "isCount" BOOLEAN NOT NULL DEFAULT false,
    "isRetirement" BOOLEAN NOT NULL DEFAULT false,
    "insuranceGroup" TEXT,
    "expectedReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incomeLimitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasDividend" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FundType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "taxYear" INTEGER NOT NULL,

    CONSTRAINT "DeductionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInvestment" (
    "id" SERIAL NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "profileId" INTEGER NOT NULL,
    "fundTypeId" INTEGER NOT NULL,

    CONSTRAINT "UserInvestment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL,
    "savingsTarget" DOUBLE PRECISION NOT NULL,
    "totalGoal" DOUBLE PRECISION,
    "isPercentage" BOOLEAN NOT NULL,
    "monthlyLimit" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "targetMonth" INTEGER NOT NULL,
    "targetYear" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "monthlyAmount" DECIMAL(10,2) NOT NULL,
    "totalTerms" INTEGER NOT NULL,
    "currentTerm" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "lastPaidDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "categoryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FundType_code_key" ON "FundType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DeductionProfile_userId_taxYear_key" ON "DeductionProfile"("userId", "taxYear");

-- CreateIndex
CREATE UNIQUE INDEX "UserInvestment_profileId_fundTypeId_key" ON "UserInvestment"("profileId", "fundTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_userId_key" ON "Goal"("userId");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionProfile" ADD CONSTRAINT "DeductionProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvestment" ADD CONSTRAINT "UserInvestment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "DeductionProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInvestment" ADD CONSTRAINT "UserInvestment_fundTypeId_fkey" FOREIGN KEY ("fundTypeId") REFERENCES "FundType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
