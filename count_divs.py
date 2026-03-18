import re

path = r'c:\AgTech\Apps\veritum-pro\src\components\modules\nexus.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

balance = 0
for i, line in enumerate(lines, 1):
    openers = len(re.findall(r'<div\b', line))
    closers = len(re.findall(r'</div>', line))
    balance += (openers - closers)
    if balance < 0:
        print(f"Broke at line {i}: balance={balance} -> {line.strip()}")
        balance = 0
print(f"Final balance: {balance}")
