const fs = require('fs');
const paths = [
  'src/components/modules/person-management.tsx',
  'src/components/modules/nexus/tabs/LawsuitsTab.tsx',
  'src/components/modules/nexus/tabs/TasksTab.tsx',
  'src/components/modules/nexus/tabs/AssetsTab.tsx',
  'src/components/modules/nexus/tabs/SocietarioTab.tsx'
];

paths.forEach(p => {
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf-8');
  
  content = content.replace(/text-base>/g, 'text-base\">');
  content = content.replace(/text-baseuppercase/g, 'text-base uppercase');
  content = content.replace(/text-baseborder/g, 'text-base border');
  content = content.replace(/text-baseleading/g, 'text-base leading');
  content = content.replace(/text-basepx/g, 'text-base px');
  content = content.replace(/text-basemb/g, 'text-base mb');
  content = content.replace(/text-basewhitespace/g, 'text-base whitespace');
  content = content.replace(/text-basemt/g, 'text-base mt');
  content = content.replace(/text-basefont/g, 'text-base font');
  
  fs.writeFileSync(p, content);
  console.log('Fixed', p);
});
