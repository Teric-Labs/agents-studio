with open("c:\\Users\\Personal\\OneDrive\\Desktop\\Etoil\\etoil-agents\\src\\api\\main.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "/livekit/token" in line:
        start = max(0, i - 10)
        end = min(len(lines), i + 40)
        print("".join(lines[start:end]))
