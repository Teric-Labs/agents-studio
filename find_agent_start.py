with open("c:\\Users\\Personal\\OneDrive\\Desktop\\Etoil\\etoil-agents\\src\\api\\main.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

start_idx = 0
for idx, line in enumerate(lines):
    if "/start" in line and "agents" in line:
        start_idx = idx
        break

print("".join(lines[start_idx-5:start_idx+65]))
