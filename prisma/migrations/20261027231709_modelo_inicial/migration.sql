/*
  Warnings:

  - You are about to drop the `cursos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `horarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `professores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `turmas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "horarios" DROP CONSTRAINT "horarios_sala_id_fkey";

-- DropForeignKey
ALTER TABLE "horarios" DROP CONSTRAINT "horarios_turma_id_fkey";

-- DropForeignKey
ALTER TABLE "turmas" DROP CONSTRAINT "turmas_curso_id_fkey";

-- DropForeignKey
ALTER TABLE "turmas" DROP CONSTRAINT "turmas_professor_id_fkey";

-- DropTable
DROP TABLE "cursos";

-- DropTable
DROP TABLE "horarios";

-- DropTable
DROP TABLE "professores";

-- DropTable
DROP TABLE "salas";

-- DropTable
DROP TABLE "turmas";

-- DropEnum
DROP TYPE "dia_semana";

-- CreateTable
CREATE TABLE "aula" (
    "id_aula" SERIAL NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_disciplina" INTEGER NOT NULL,
    "id_professor" INTEGER NOT NULL,
    "id_turma" INTEGER NOT NULL,
    "dia_semana" VARCHAR(10) NOT NULL,
    "periodo" VARCHAR(12) NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_termino" TIME(6) NOT NULL,

    CONSTRAINT "aula_pkey" PRIMARY KEY ("id_aula")
);

-- CreateTable
CREATE TABLE "curso" (
    "id_curso" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "sigla" VARCHAR(10) NOT NULL,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("id_curso")
);

-- CreateTable
CREATE TABLE "disciplina" (
    "id_disciplina" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,

    CONSTRAINT "disciplina_pkey" PRIMARY KEY ("id_disciplina")
);

-- CreateTable
CREATE TABLE "imagem_local" (
    "id_imagem" SERIAL NOT NULL,
    "id_local" INTEGER NOT NULL,
    "tipo_imagem" VARCHAR(12) NOT NULL,
    "caminho_imagem" VARCHAR(500) NOT NULL,
    "descricao" VARCHAR(255),
    "ordem_exibicao" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "imagem_local_pkey" PRIMARY KEY ("id_imagem")
);

-- CreateTable
CREATE TABLE "local" (
    "id_local" SERIAL NOT NULL,
    "tipo_local" VARCHAR(20) NOT NULL,
    "id_local_pai" INTEGER,
    "nome" VARCHAR(100) NOT NULL,
    "codigo" VARCHAR(30),
    "bloco" VARCHAR(50),
    "andar" INTEGER,
    "localizacao_mapa" VARCHAR(255) NOT NULL,

    CONSTRAINT "local_pkey" PRIMARY KEY ("id_local")
);

-- CreateTable
CREATE TABLE "professor" (
    "id_professor" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,

    CONSTRAINT "professor_pkey" PRIMARY KEY ("id_professor")
);

-- CreateTable
CREATE TABLE "sala" (
    "id_sala" INTEGER NOT NULL,

    CONSTRAINT "sala_pkey" PRIMARY KEY ("id_sala")
);

-- CreateTable
CREATE TABLE "turma" (
    "id_turma" SERIAL NOT NULL,
    "semestre" INTEGER NOT NULL,

    CONSTRAINT "turma_pkey" PRIMARY KEY ("id_turma")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_imagem_local" ON "imagem_local"("id_local", "caminho_imagem");

-- CreateIndex
CREATE UNIQUE INDEX "local_codigo_key" ON "local"("codigo");

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "fk_aula_curso" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "fk_aula_disciplina" FOREIGN KEY ("id_disciplina") REFERENCES "disciplina"("id_disciplina") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "fk_aula_professor" FOREIGN KEY ("id_professor") REFERENCES "professor"("id_professor") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "fk_aula_sala" FOREIGN KEY ("id_sala") REFERENCES "sala"("id_sala") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "fk_aula_turma" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "imagem_local" ADD CONSTRAINT "fk_imagem_local" FOREIGN KEY ("id_local") REFERENCES "local"("id_local") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local" ADD CONSTRAINT "fk_local_pai" FOREIGN KEY ("id_local_pai") REFERENCES "local"("id_local") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sala" ADD CONSTRAINT "fk_sala_local" FOREIGN KEY ("id_sala") REFERENCES "local"("id_local") ON DELETE CASCADE ON UPDATE NO ACTION;
