const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'c:/AgTech/Apps/veritum-pro/src/app/veritum/[module]/page.tsx',
    'c:/AgTech/Apps/veritum-pro/src/app/veritum/fintech/page.tsx',
    'c:/AgTech/Apps/veritum-pro/src/components/modules/vip-management.tsx',
    'c:/AgTech/Apps/veritum-pro/src/components/dashboard-layout.tsx',
    'c:/AgTech/Apps/veritum-pro/src/components/modules/cloud-manager.tsx'
];

filesToProcess.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log('Skipping (not found):', file);
        return;
    }
    let content = fs.readFileSync(file, 'utf8');

    // Specific replacement for vipManagement which is named as 'vip' in locales
    // Actually, I'll allow both.
    content = content.replace(/t\('master\.vipManagement\./g, "t('management.master.vip.");

    // Standard replacements for master.* labels
    // Only replace if they start with master. and are not already management.master.
    content = content.replace(/(?<!management\.)t\('master\./g, "t('management.master.");

    fs.writeFileSync(file, content);
    console.log('Successfully processed:', file);
});
