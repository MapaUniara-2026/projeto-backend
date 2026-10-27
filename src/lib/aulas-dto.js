// Formato de consulta (select/ordem) e de resposta das aulas. Separado da rota para ser testável sem banco.
// Só o que a tela usa. Sem e-mail do professor (dado pessoal que o mapa não precisa expor).
export const SELECAO = {
  id: true,
  diaSemana: true,
  horaInicio: true,
  horaFim: true,
  sala: { select: { codigo: true, bloco: true } },
  turma: {
    select: {
      codigo: true,
      semestre: true,
      curso: { select: { codigo: true, nome: true } },
      professor: { select: { nome: true } },
    },
  },
}

// Ordena pela chave primária: é estável e o PostgreSQL a atende pelo índice, parando no LIMIT.
// Ordenar por dia/hora/sala obrigava a ordenar TODAS as linhas antes do limite (697 ms vs 19 ms sem filtro,
// em 96 mil horários). Quem exibe a lista (ex.: agenda de uma sala) ordena no cliente.
export const ORDEM = [{ id: 'asc' }]

export function paraAula(h) {
  return {
    id: h.id,
    sala: { codigo: h.sala.codigo, bloco: h.sala.bloco },
    curso: { codigo: h.turma.curso.codigo, nome: h.turma.curso.nome },
    turma: { codigo: h.turma.codigo, semestre: h.turma.semestre },
    docente: h.turma.professor.nome,
    dia: h.diaSemana,
    horaInicio: h.horaInicio,
    horaFim: h.horaFim,
  }
}
