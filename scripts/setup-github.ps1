# ------------------------------------------------------------------
# Versão para Windows (PowerShell) do setup-github.sh.
# Cria o repositório no GitHub e configura o fluxo DEV -> QA -> PRD.
#
# Pré-requisitos: Git e GitHub CLI (gh) instalados e logados (gh auth login)
#
# Uso (na pasta do repositório):
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-github.ps1 MapaUniara-2026/projeto-backend 0
#
# O último número é quantas aprovações cada PR exige (0 enquanto estiver sozinho).
# O repositório é criado PÚBLICO: no plano gratuito, proteção de branch só funciona
# em repositório público, e a Vercel Hobby só faz deploy de repo de organização público.
# ------------------------------------------------------------------
param(
  [Parameter(Mandatory = $true)][string]$Repo,
  [int]$Aprovacoes = 1
)

$ErrorActionPreference = 'Stop'

function Executar {
  param([string]$Descricao, [scriptblock]$Comando)
  Write-Host "==> $Descricao" -ForegroundColor Cyan
  & $Comando
  if ($LASTEXITCODE -ne 0) { throw "Falhou: $Descricao (código $LASTEXITCODE)" }
}

if (-not (Test-Path .git)) {
  Executar 'Inicializando repositório local' {
    git init -b main
    if ($LASTEXITCODE -eq 0) { git add . }
    if ($LASTEXITCODE -eq 0) { git commit -m 'chore: estrutura inicial (v0.1.0)' }
  }
}

Executar "Criando repositório público $Repo" { gh repo create $Repo --public --source=. --remote=origin --push }
Executar 'Criando branch qa' { git push origin main:qa }
Executar 'Criando branch dev' { git push origin main:dev }

Executar "Definindo 'dev' como branch padrão" {
  gh api -X PATCH "repos/$Repo" -f default_branch=dev -F delete_branch_on_merge=true `
    -F allow_merge_commit=true -F allow_squash_merge=true -F allow_rebase_merge=false | Out-Null
}

function Proteger {
  param([string]$Branch, [string[]]$Checks)
  $regras = @{
    required_status_checks          = @{ strict = $true; contexts = $Checks }
    enforce_admins                  = $true
    required_pull_request_reviews   = @{ required_approving_review_count = $Aprovacoes; dismiss_stale_reviews = $true }
    restrictions                    = $null
    allow_force_pushes              = $false
    allow_deletions                 = $false
    required_conversation_resolution = $true
  }
  # Grava em UTF-8 sem BOM para os nomes dos checks com acento chegarem certos ao GitHub.
  $arquivo = Join-Path ([System.IO.Path]::GetTempPath()) "protecao-$Branch.json"
  [System.IO.File]::WriteAllText($arquivo, ($regras | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding $false))
  try {
    Executar "Protegendo branch '$Branch'" {
      gh api -X PUT "repos/$Repo/branches/$Branch/protection" -H 'Accept: application/vnd.github+json' --input $arquivo | Out-Null
    }
  } finally {
    Remove-Item $arquivo -ErrorAction SilentlyContinue
  }
}

$checks = @('Validar branch de origem', 'Back-end')
Proteger 'dev'  $checks
Proteger 'qa'   $checks
Proteger 'main' ($checks + 'Validar versão (somente PR para PRD)')

Write-Host ''
Write-Host "Pronto! https://github.com/$Repo" -ForegroundColor Green
Write-Host '  - Push direto em dev/qa/main está bloqueado (inclusive para admins).'
Write-Host '  - Fluxo: feature/* -> dev -> qa -> main (PRD).'
Write-Host '  - Próximo passo: configurar a Vercel (ver README).'
