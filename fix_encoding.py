
import os

file_path = r'c:\AgTech\Apps\veritum-pro\src\components\modules\nexus.tsx'

# Mapeamento de corrupções comuns de UTF-8 (lidos como Windows-1252)
replacements = {
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã-': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã ': 'à',
    'Ã¢': 'â',
    'Ãª': 'ê',
    'Ã´': 'ô',
    'Ã£': 'ã',
    'Ãµ': 'õ',
    'Ã§': 'ç',
    'Âª': 'ª',
    'Âº': 'º',
    'Ã“': 'Ó',
    'Ã‰': 'É',
    'Ã€': 'À',
    'Ã‚': 'Â',
    'ÃŠ': 'Ê',
    'Ã”': 'Ô',
    'Ãƒ': 'Ã',
    'Ã•': 'Õ',
    'Ã‡': 'Ç',
    'Â ': ' ', # Espaços inquebráveis que viram Â
}

if os.path.exists(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    for corrupted, fixed in replacements.items():
        content = content.replace(corrupted, fixed)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed encoding in {file_path}")
else:
    print(f"File not found: {file_path}")
