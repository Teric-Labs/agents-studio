with open("c:\\Users\\Personal\\OneDrive\\Desktop\\Etoil\\etoil-agents\\src\\api\\main.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

# find def get_livekit_token
start_idx = 0
for idx, line in enumerate(lines):
    if "async def get_livekit_token" in line:
        start_idx = idx
        break

print("".join(lines[start_idx:start_idx+80]))
