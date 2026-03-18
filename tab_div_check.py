import re

path = r'c:\AgTech\Apps\veritum-pro\src\components\modules\nexus.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

balance = 0
for i, line in enumerate(lines, 1):
    openers = line.count('<div')
    closers = line.count('</div>')
    balance += (openers - closers)
    if balance < 0:
        # print(f"Negative balance at line {i}: {line.strip()}")
        # Skip for counts
        pass
print(f"Final overall balance: {balance}")

# Check specific blocks
blocks = [
    (2056, 2342, "Overview"),
    (2343, 2383, "Pessoas"),
    (2385, 2852, "Processos"),
    (2854, 3111, "Tarefas"),
    (3112, 3310, "Agenda"),
    (3311, 3677, "Ativos"),
    (3679, 4047, "Societario"),
    (4048, 4065, "Documentos")
]

for start, end, name in blocks:
    b = 0
    for i in range(start-1, end):
        line = lines[i]
        b += (line.count('<div') - line.count('</div>'))
    print(f"Tab {name} balance: {b}")
