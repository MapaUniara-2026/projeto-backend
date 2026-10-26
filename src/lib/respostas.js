// Formato das respostas da API, montado campo a campo.
// Regras: só sai o que está aqui (nada de criadoEm/atualizadoEm), campo sem valor sai como null
// (nunca omitido), listas vazias saem como [] e horas saem como "HH:MM".
// Para cada mapper existe um "select" com exatamente as colunas que ele usa.
// Horas: use formatarHora (src/lib/horario.js) nos mappers de aulas/horários.

export const selectCurso = { id: true, codigo: true, nome: true }

export const cursoResposta = (curso) => ({
  id: curso.id,
  codigo: curso.codigo,
  nome: curso.nome,
})

export const selectTurma = { id: true, codigo: true, semestre: true }

export const turmaResposta = (turma) => ({
  id: turma.id,
  codigo: turma.codigo,
  semestre: turma.semestre ?? null,
})

export const selectCursoDetalhe = { ...selectCurso, turmas: { select: selectTurma, orderBy: { codigo: 'asc' } } }

export const cursoDetalheResposta = (curso) => ({
  ...cursoResposta(curso),
  turmas: (curso.turmas ?? []).map(turmaResposta),
})

// nome, andar, tipo e fotos fazem parte do contrato, mas ainda não existem no schema
// (chegam com o alinhamento ao DER). Até lá saem como null / [] e o front já pode contar com eles.
export const selectSala = { id: true, codigo: true, bloco: true, capacidade: true }

export const salaResposta = (sala) => ({
  id: sala.id,
  codigo: sala.codigo,
  nome: sala.nome ?? null,
  bloco: sala.bloco ?? null,
  andar: sala.andar ?? null,
  tipo: sala.tipo ?? null,
  capacidade: sala.capacidade ?? null,
  fotos: fotosResposta(sala.fotos),
})

// Imagem indisponível (sem foto cadastrada ou referência sem URL) não é erro: some da lista,
// e a sala sem nenhuma foto sai com "fotos": [] (RF17). O front mostra "Foto indisponível".
export const fotosResposta = (fotos) =>
  (fotos ?? [])
    .filter((foto) => typeof foto?.url === 'string' && foto.url.trim())
    .map((foto) => ({ url: foto.url, descricao: foto.descricao ?? null }))
