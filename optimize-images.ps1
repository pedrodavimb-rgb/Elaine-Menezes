Add-Type -AssemblyName System.Drawing

$imgDir = Join-Path $PSScriptRoot "public\images"

function Resize-Jpeg {
    param([string]$src, [string]$dst, [int]$maxDim, [int]$quality)

    $img = [System.Drawing.Image]::FromFile($src)
    try {
        # Respeita a orientacao EXIF (etiqueta 274) girando os pixels de verdade
        $hasOrientation = $false
        foreach ($id in $img.PropertyIdList) { if ($id -eq 274) { $hasOrientation = $true } }

        if ($hasOrientation) {
            $orientation = [int]($img.GetPropertyItem(274).Value[0])
            Write-Output "  [$([System.IO.Path]::GetFileName($src))] EXIF orientation = $orientation"
            switch ($orientation) {
                2 { $img.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
                3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
                4 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
                5 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
                6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
                7 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
                8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
            }
            $img.RemovePropertyItem(274)
        } else {
            Write-Output "  [$([System.IO.Path]::GetFileName($src))] SEM etiqueta EXIF de orientacao"
        }

        $w = $img.Width
        $h = $img.Height
        $scale = [Math]::Min(1.0, $maxDim / [Math]::Max($w, $h))
        $nw = [int]([Math]::Round($w * $scale))
        $nh = [int]([Math]::Round($h * $scale))

        $bmp = New-Object System.Drawing.Bitmap $nw, $nh
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.DrawImage($img, 0, 0, $nw, $nh)
        $g.Dispose()

        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $params = New-Object System.Drawing.Imaging.EncoderParameters 1
        $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)

        $bmp.Save($dst, $codec, $params)
        $bmp.Dispose()

        Write-Output "$([System.IO.Path]::GetFileName($dst)) -> ${nw}x${nh}px"
    }
    finally {
        $img.Dispose()
    }
}

# Optimize the large photos (only when a raw .JPG source is present;
# foto-hero.jpg already ships web-sized)
if (Test-Path (Join-Path $imgDir "foto-hero.jpg.JPG")) {
    Resize-Jpeg -src (Join-Path $imgDir "foto-hero.jpg.JPG") -dst (Join-Path $imgDir "foto-hero.jpg") -maxDim 1400 -quality 85
}
if (Test-Path (Join-Path $imgDir "foto-preta.jpg.JPG")) {
    Resize-Jpeg -src (Join-Path $imgDir "foto-preta.jpg.JPG") -dst (Join-Path $imgDir "foto-preta.jpg") -maxDim 1400 -quality 85
}

# Copy logo to a clean name (already small)
Copy-Item (Join-Path $imgDir "logo.png.png") (Join-Path $imgDir "logo.png") -Force

# Report sizes
Write-Output "--- Tamanhos finais ---"
Get-ChildItem $imgDir -File | Where-Object { $_.Name -in 'foto-hero.jpg','foto-preta.jpg','logo.png' } | ForEach-Object {
    "{0,-22} {1,8:N0} KB" -f $_.Name, ($_.Length / 1KB)
}
