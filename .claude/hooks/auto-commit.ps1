# PostToolUse hook: Edit/Write after auto git add + commit + push
# Uses $PSScriptRoot to find repo root dynamically (avoids hardcoded Korean path)

$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH','User')

# Script is at <repo>/.claude/hooks/auto-commit.ps1
# Go up two levels to reach repo root
$repoDir = Split-Path (Split-Path $PSScriptRoot)

$inGit = git -C $repoDir rev-parse --is-inside-work-tree 2>$null
if ($inGit -ne 'true') { exit 0 }

Set-Location $repoDir
$changed = git status --porcelain 2>$null
if (-not $changed) { exit 0 }

$lines = $changed.Split([System.Environment]::NewLine, [System.StringSplitOptions]::RemoveEmptyEntries)
$files = ($lines | ForEach-Object { $_.Substring(3).Trim() }) -join ', '

git add -A 2>$null
git commit -m "auto: $files" 2>$null
git push 2>$null

exit 0
