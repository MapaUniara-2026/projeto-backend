/*
  Warnings:

  - The values [SABADO] on the enum `dia_semana` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `cursos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `codigo` on the `cursos` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `cursos` table. All the data in the column will be lost.
  - The primary key for the `professores` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `professores` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `professores` table. All the data in the column will be lost.
  - The primary key for the `salas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `capacidade` on the `salas` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `salas` table. All the data in the column will be lost.
  - The primary key for the `turmas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `codigo` on the `turmas` table. All the data in the column will be lost.
  - You are about to drop the column `curso_id` on the `turmas` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `turmas` table. All the data in the column will be lost.
  - You are about to drop the column `professor_id` on the `turmas` table. All the data in the column will be lost.
  - You are about to drop the `horarios` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sigla]` on the table `cursos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sigla` to the `cursos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `andar` to the `salas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `localizacao_mapa` to the `salas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `salas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `salas` table without a default value. This is not possible if the table is not empty.
  - Made the column `bloco` on table `salas` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `nome` to the `turmas` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `semestre` on the `turmas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- Ajuste manual: limpa os dados antigos antes de reestruturar.
-- As chaves primárias mudam (id -> id_sala, id_curso...) e várias colunas obrigatórias são criadas,
-- então os registros antigos não teriam como ser convertidos. Até aqui os ambientes só têm dados de exemplo
-- do seed; depois do deploy, rode o seed novo para repopular.
TRUNCATE TABLE "horarios", "turmas", "salas", "professores", "cursos" RESTART IDENTITY;

-- CreateEnum
CREATE TYPE "periodo" AS ENUM ('MATUTINO', 'VESPERTINO', 'NOTURNO');

-- DropTable
-- "horarios" é substituída por "aulas". Ela sai primeiro porque é a única tabela que usa o tipo "dia_semana".
-- (Ajuste manual: o SQL gerado pelo Prisma alterava "aulas" antes de ela existir.)
DROP TABLE "horarios";

-- AlterEnum: remove SABADO (RN04 — aulas só de segunda a sexta)
DROP TYPE "dia_semana";
CREATE TYPE "dia_semana" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA');

-- DropForeignKey
ALTER TABLE "turmas" DROP CONSTRAINT "turmas_curso_id_fkey";

-- DropForeignKey
ALTER TABLE "turmas" DROP CONSTRAINT "turmas_professor_id_fkey";

-- DropIndex
DROP INDEX "cursos_codigo_key";

-- DropIndex
DROP INDEX "professores_email_key";

-- DropIndex
DROP INDEX "turmas_codigo_semestre_key";

-- AlterTable
ALTER TABLE "cursos" DROP CONSTRAINT "cursos_pkey",
DROP COLUMN "codigo",
DROP COLUMN "id",
ADD COLUMN     "id_curso" SERIAL NOT NULL,
ADD COLUMN     "sigla" VARCHAR(20) NOT NULL,
ADD CONSTRAINT "cursos_pkey" PRIMARY KEY ("id_curso");

-- AlterTable
ALTER TABLE "professores" DROP CONSTRAINT "professores_pkey",
DROP COLUMN "email",
DROP COLUMN "id",
ADD COLUMN     "id_professor" SERIAL NOT NULL,
ADD CONSTRAINT "professores_pkey" PRIMARY KEY ("id_professor");

-- AlterTable
ALTER TABLE "salas" DROP CONSTRAINT "salas_pkey",
DROP COLUMN "capacidade",
DROP COLUMN "id",
ADD COLUMN     "andar" INTEGER NOT NULL,
ADD COLUMN     "id_sala" SERIAL NOT NULL,
ADD COLUMN     "localizacao_mapa" VARCHAR(255) NOT NULL,
ADD COLUMN     "nome" VARCHAR(120) NOT NULL,
ADD COLUMN     "tipo" VARCHAR(30) NOT NULL,
ALTER COLUMN "bloco" SET NOT NULL,
ADD CONSTRAINT "salas_pkey" PRIMARY KEY ("id_sala");

-- AlterTable
ALTER TABLE "turmas" DROP CONSTRAINT "turmas_pkey",
DROP COLUMN "codigo",
DROP COLUMN "curso_id",
DROP COLUMN "id",
DROP COLUMN "professor_id",
ADD COLUMN     "id_turma" SERIAL NOT NULL,
ADD COLUMN     "nome" VARCHAR(60) NOT NULL,
DROP COLUMN "semestre",
ADD COLUMN     "semestre" INTEGER NOT NULL,
ADD CONSTRAINT "turmas_pkey" PRIMARY KEY ("id_turma");

-- CreateTable
CREATE TABLE "imagens" (
    "id_imagem" SERIAL NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "url_imagem" VARCHAR(500) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imagens_pkey" PRIMARY KEY ("id_imagem")
);

-- CreateTable
CREATE TABLE "disciplinas" (
    "id_disciplina" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id_disciplina")
);

-- CreateTable
CREATE TABLE "aulas" (
    "id_aula" SERIAL NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_disciplina" INTEGER NOT NULL,
    "id_professor" INTEGER NOT NULL,
    "id_turma" INTEGER NOT NULL,
    "dia_semana" "dia_semana" NOT NULL,
    "periodo" "periodo" NOT NULL,
    "hora_inicio" TIME(0) NOT NULL,
    "hora_termino" TIME(0) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aulas_pkey" PRIMARY KEY ("id_aula")
);

-- CreateIndex
CREATE INDEX "imagens_id_sala_idx" ON "imagens"("id_sala");

-- CreateIndex
CREATE INDEX "aulas_id_curso_idx" ON "aulas"("id_curso");

-- CreateIndex
CREATE INDEX "aulas_id_disciplina_idx" ON "aulas"("id_disciplina");

-- CreateIndex
CREATE INDEX "aulas_id_professor_idx" ON "aulas"("id_professor");

-- CreateIndex
CREATE UNIQUE INDEX "aulas_id_sala_dia_semana_hora_inicio_key" ON "aulas"("id_sala", "dia_semana", "hora_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "aulas_id_turma_dia_semana_hora_inicio_key" ON "aulas"("id_turma", "dia_semana", "hora_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_sigla_key" ON "cursos"("sigla");

-- AddForeignKey
ALTER TABLE "imagens" ADD CONSTRAINT "imagens_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "salas"("id_sala") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "salas"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_id_disciplina_fkey" FOREIGN KEY ("id_disciplina") REFERENCES "disciplinas"("id_disciplina") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professores"("id_professor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turmas"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;
