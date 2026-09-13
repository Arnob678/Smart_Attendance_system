Add-Type -AssemblyName System.Drawing
$srcPath = Join-Path $PSScriptRoot "..\public\ruet_logo.png"
$destPath = Join-Path $PSScriptRoot "..\public\ruet_logo_sm.png"

$src = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
$dest = New-Object System.Drawing.Bitmap 240, 240
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, 240, 240)
$dest.Save((Resolve-Path (Join-Path $PSScriptRoot "..\public") | Join-Path -ChildPath "ruet_logo_sm.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$dest.Dispose()
$src.Dispose()

Write-Host "Created ruet_logo_sm.png, size:" (Get-Item (Join-Path $PSScriptRoot "..\public\ruet_logo_sm.png")).Length
