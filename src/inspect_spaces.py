with open(r'c:\AgTech\Apps\veritum-pro\src\components\modules\nexus.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i in range(4515, 4535):
        print(f"{i+1}: {repr(lines[i])}")
