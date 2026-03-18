import re

path = r'c:\AgTech\Apps\veritum-pro\src\components\modules\nexus.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

div_balance = 0
paren_balance = 0
brace_balance = 0

for i, line in enumerate(lines, 1):
    div_balance += line.count('<div') - line.count('</div>')
    paren_balance += line.count('(') - line.count(')')
    brace_balance += line.count('{') - line.count('}')
    
    if div_balance < 0:
        print(f"Negative DIV balance at line {i}: {div_balance} -> {line.strip()}")
        div_balance = 0
    if paren_balance < 0:
        print(f"Negative PAREN balance at line {i}: {paren_balance} -> {line.strip()}")
        paren_balance = 0
    if brace_balance < 0:
        print(f"Negative BRACE balance at line {i}: {brace_balance} -> {line.strip()}")
        brace_balance = 0

print(f"Final: div={div_balance}, paren={paren_balance}, brace={brace_balance}")
