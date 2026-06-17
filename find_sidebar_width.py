import os

def search_text(path, text):
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.css'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        for line_num, line in enumerate(f, 1):
                            if text in line:
                                print(f"{filepath}:{line_num}: {line.strip()}")
                except Exception as e:
                    pass

search_text("c:\\Users\\Personal\\OneDrive\\Desktop\\Etoil\\etoil-agents-studio\\src", "sidebar-width")
