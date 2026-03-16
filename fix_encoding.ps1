
$filePath = "c:\AgTech\Apps\veritum-pro\src\components\modules\nexus.tsx"
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

$replacements = @{
    "Ã§" = "ç";
    "Ã£" = "ã";
    "Ã­" = "í";
    "Ã³" = "ó";
    "Ã©" = "é";
    "Ãª" = "ê";
    "Ãº" = "ú";
    "Ã¡" = "á";
    "Ã´" = "ô";
    "Ã " = "à";
    "Ãµ" = "õ";
    "Ã¢" = "â";
    "Ã€" = "À";
    "Ã‰" = "É";
    "Ã“" = "Ó";
    "Ãš" = "Ú";
    "Ã‚" = "Â";
    "Ã‡" = "Ç";
    "Ã…" = "Å";
    "Ã†" = "Æ";
    "Ãˆ" = "È";
    "ÃŒ" = "Ì";
    "ÃŽ" = "Î";
    "Ã‘" = "Ñ";
    "Ã’" = "Ò";
    "Ã–" = "Ö";
    "Ã—" = "×";
    "Ã˜" = "Ø";
    "Ã™" = "Ù";
    "Ãœ" = "Ü";
    "Ãž" = "Þ";
    "ÃŸ" = "ß";
    "Ã°" = "ð";

    # Emojis and other symbols
    "ðŸ‘¤" = "👤";
    "ðŸ ¢" = "🏢";
    "âš–ï¸ " = "⚖️";
    "ðŸ“ " = "📍";
    "ðŸ“¦" = "📦";
    "ðŸ“„" = "📄";
    "ðŸ“‹" = "📋";
    "ðŸ“ " = "📂";
    "ðŸ—‚" = "🗂";
    "ðŸ— " = "🗑";
    "ðŸ“ž" = "📞";
    "ðŸ“§" = "📧";
    "ðŸ” " = "🔍";
    "ðŸ”’" = "🔓";
    "ðŸ”'" = "🔒";
    "ðŸ”" = "🔔";
    "ðŸ–¤" = "🖤";
    "ðŸ’Ž" = "💎";
    "ðŸ’¬" = "💬";
    "ðŸ“±" = "📱";
    "ðŸ–¥️" = "🖥️";
    "ðŸ–¨️" = "️";
    "ðŸš€" = "🚀";
    "ðŸ—º" = "🗺️";
    "ðŸŒ " = "🌐";
    "ðŸ’°" = "💰";
    "ðŸ“ˆ" = "📈";
    "ðŸ“‰" = "📉";
}

foreach ($key in $replacements.Keys) {
    $content = $content.Replace($key, $replacements[$key])
}

[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Host "File $filePath fixed."
