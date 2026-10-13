#!/usr/bin/env bash
# ------------------------------------------------------------------
# Cria o repositório no GitHub e configura o fluxo DEV -> QA -> PRD.
#
# Pré-requisitos: git e GitHub CLI (gh) instalados e logados (gh auth login)
#
# Uso:
#   ./scripts/setup-github.sh <dono/nome-do-repo> [aprovacoes]
#
# Exemplo:
#   ./scripts/setup-github.sh MapaUniara-2026/projeto-backend 1
#
# O repositório é criado PÚBLICO de propósito: no plano gratuito,
#  - proteção de branch só funciona em repositório público;
#  - a Vercel Hobby só faz deploy de repositório de organização se ele for público.
# ------------------------------------------------------------------
set -euo pipefail

REPO="${1:?Informe dono/nome, ex.: MapaUniara-2026/projeto-backend}"
APROVACOES="${2:-1}"   # nº de aprovações exigidas em cada PR (0 se estiver testando sozinho)

echo "==> Criando repositório público $REPO"
if [ ! -d .git ]; then
  git init -b main
  git add .
  git commit -m "chore: estrutura inicial (v0.1.0)"
fi
gh repo create "$REPO" --public --source=. --remote=origin --push

echo "==> Criando branches dev e qa a partir de main"
git push origin main:qa
git push origin main:dev

echo "==> Definindo 'dev' como branch padrão e apagando branches após merge"
gh api -X PATCH "repos/$REPO" \
  -f default_branch=dev \
  -F delete_branch_on_merge=true \
  -F allow_merge_commit=true \
  -F allow_squash_merge=true \
  -F allow_rebase_merge=false > /dev/null

proteger() {
  local BRANCH="$1"; shift
  local CONTEXTS
  CONTEXTS=$(printf '"%s",' "$@"); CONTEXTS="[${CONTEXTS%,}]"

  echo "==> Protegendo branch '$BRANCH'"
  gh api -X PUT "repos/$REPO/branches/$BRANCH/protection" \
    -H "Accept: application/vnd.github+json" \
    --input - > /dev/null <<JSON
{
  "required_status_checks": { "strict": true, "contexts": $CONTEXTS },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": $APROVACOES,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
}

CHECKS=("Validar branch de origem" "Back-end")
proteger dev  "${CHECKS[@]}"
proteger qa   "${CHECKS[@]}"
proteger main "${CHECKS[@]}" "Validar versão (somente PR para PRD)"

echo
echo "✅ Pronto! https://github.com/$REPO"
echo "   - Push direto em dev/qa/main está bloqueado (inclusive para admins)."
echo "   - Fluxo: feature/* -> dev -> qa -> main (PRD)."
echo "   - Próximo passo: configurar a Vercel (ver README)."
