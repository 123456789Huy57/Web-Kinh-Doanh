# Fix CSP in all HTML files
$files = Get-ChildItem "*.html"
$fixed = 0
$skipped = 0

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    $changed = $false
    
    # Fix script-src: add googletagmanager.com
    if ($content -match "script-src 'self' 'unsafe-inline' 'unsafe-eval';") {
        $content = $content.Replace(
            "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;"
        )
        $changed = $true
    }
    
    # Fix style-src: add fonts.googleapis.com
    if ($content -match "style-src 'self' 'unsafe-inline';") {
        $content = $content.Replace(
            "style-src 'self' 'unsafe-inline';",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
        )
        $changed = $true
    }
    
    # Fix connect-src: add google analytics domains
    if ($content -match "connect-src 'self';") {
        $content = $content.Replace(
            "connect-src 'self';",
            "connect-src 'self' https://www.google-analytics.com https://www.google.com https://analytics.google.com;"
        )
        $changed = $true
    }
    
    if ($changed) {
        [System.IO.File]::WriteAllText($f.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "FIXED: $($f.Name)"
        $fixed++
    } else {
        Write-Host "OK: $($f.Name)"
        $skipped++
    }
}

Write-Host "`nDone. Fixed: $fixed, Already OK: $skipped"
