
import os

# Relative path from the script location
filepath = os.path.join("src", "modules", "articles", "pages", "ArticleManagement.jsx")

if not os.path.exists(filepath):
    print(f"File not found: {filepath}")
    exit(1)

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Update useEffect
old_effect = "    useEffect(() => {\n        fetchArticles();\n    }, []);"
new_effect = "    useEffect(() => {\n        fetchArticles();\n        syncFeatures();\n    }, [activeTab, filterDate]);"

if old_effect in content:
    content = content.replace(old_effect, new_effect)
    print("Effect updated")
else:
    print("Effect not found")

# Fix 2: Add loadingMore div
old_ui = "                )}\n            </div>"
new_ui = "                )}\n                {loadingMore && (\n                    <div className=\"am-loading-more\">\n                        <i className=\"fas fa-circle-notch fa-spin\"></i> Loading more...\n                    </div>\n                )}\n            </div>"

if old_ui in content:
    content = content.replace(old_ui, new_ui)
    print("UI updated")
else:
    print("UI not found")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
