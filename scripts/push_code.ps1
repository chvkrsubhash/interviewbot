# PowerShell script to add, commit, and push changes to the repository
# Save this file as scripts/push_code.ps1 and run it from the project root.

param(
    [string]$CommitMessage = "Update code"
)

# Ensure we are in the project directory
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# Stage all changes
git add .

# Commit with provided message
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = "Update code $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")"
}

git commit -m $CommitMessage

# Push to the current branch's upstream (or origin/main if no upstream set)
# If the branch does not have an upstream, set it to origin
$branch = git rev-parse --abbrev-ref HEAD
$upstream = git rev-parse --abbrev-ref @{u} 2>$null
if (-not $upstream) {
    git push -u origin $branch
} else {
    git push
}

Write-Host "Push completed."
