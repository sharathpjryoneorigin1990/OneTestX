# PowerShell script to rename UI component files to use consistent lowercase naming

# Change to the UI components directory
Set-Location "h:/ASU projects/new cursor/newfrontend/src/components/ui"

# List of component files to rename
$components = @(
    "Button.tsx",
    "Card.tsx",
    "Tabs.tsx",
    "Input.tsx",
    "Label.tsx",
    "Badge.tsx"
)

foreach ($file in $components) {
    $lowerFile = $file.ToLower()
    if (Test-Path $file) {
        Write-Host "Renaming $file to $lowerFile"
        Rename-Item -Path $file -NewName $lowerFile -Force
    } else {
        Write-Host "File $file not found"
    }
}

Write-Host "File renaming complete!"
