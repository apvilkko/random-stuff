# Show the current git branch of subdirectories, if they are git repos

$scriptPath = split-path -parent $MyInvocation.MyCommand.Definition
$names = Get-ChildItem -Path "." | ?{ $_.PSIsContainer }
foreach ($name in $names) {
    Set-Location $name
    $gitfile = Test-Path ".git"
    if ($gitfile) {
        $output = Invoke-Expression "git rev-parse --abbrev-ref HEAD"
        if ($output -eq "master") {
            Write-Host $name " is on [" $output "]" -foregroundcolor "green"
        } else {
            Write-Host $name " is on [" $output "]"
        }
    }
    Set-Location $scriptPath
}
