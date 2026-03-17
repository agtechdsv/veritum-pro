
const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'AgTech', 'Apps', 'veritum-pro', 'src', 'components', 'modules', 'nexus.tsx');

const replacements = {
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
    'Â ': ' ',
    'Ã‰': 'É'
};

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    Object.entries(replacements).forEach(([corrupted, fixed]) => {
        const regex = new RegExp(corrupted, 'g');
        content = content.replace(regex, fixed);
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed encoding in ${filePath}`);
} else {
    console.log(`File not found: ${filePath}`);
}
