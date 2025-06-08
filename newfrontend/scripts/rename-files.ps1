# PowerShell script to rename UI component files to use PascalCase
$uiDir = "src/components/ui"

# Files to rename (from -> to)
$filesToRename = @(
    @{ From = "badge.tsx"; To = "Badge.tsx" },
    @{ From = "button.tsx"; To = "Button.tsx" },
    @{ From = "card.tsx"; To = "Card.tsx" },
    @{ From = "input.tsx"; To = "Input.tsx" },
    @{ From = "label.tsx"; To = "Label.tsx" },
    @{ From = "select.tsx"; To = "Select.tsx" },
    @{ From = "switch.tsx"; To = "Switch.tsx" },
    @{ From = "tabs.tsx"; To = "Tabs.tsx" },
    @{ From = "toast.tsx"; To = "Toast.tsx" },
    @{ From = "toast-provider.tsx"; To = "ToastProvider.tsx" },
    @{ From = "typewriter-text.tsx"; To = "TypewriterText.tsx" },
    @{ From = "stat-card.tsx"; To = "StatCard.tsx" }
)

foreach ($file in $filesToRename) {
    $fromPath = Join-Path -Path $uiDir -ChildPath $file.From
    $toPath = Join-Path -Path $uiDir -ChildPath $file.To
    
    if (Test-Path $fromPath) {
        Write-Host "Renaming $($file.From) to $($file.To)"
        Rename-Item -Path $fromPath -NewName $file.To -Force
    } else {
        Write-Host "File $($file.From) not found, skipping..."
    }
}

Write-Host "File renaming complete!"
