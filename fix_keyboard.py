import re

with open('mobile_app/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# For Landing Page View
content = re.sub(
    r'(// --- Landing Page View ---\s*<KeyboardAvoidingView[^>]*>)',
    r'\1\n          <View style={{ flex: 1 }}>',
    content
)
# For Active Chat View
content = re.sub(
    r'(// --- Active Chat View ---\s*<KeyboardAvoidingView[^>]*>)',
    r'\1\n          <View style={{ flex: 1 }}>',
    content
)

# Close the new View before KeyboardAvoidingView closes
content = re.sub(
    r'(</KeyboardAvoidingView>)',
    r'  </View>\n        \1',
    content
)

with open('mobile_app/App.js', 'w', encoding='utf-8') as f:
    f.write(content)
