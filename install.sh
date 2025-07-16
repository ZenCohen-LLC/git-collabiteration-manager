#!/bin/bash

# Git Collabiteration Manager Installation Script
echo "🚀 Installing Git Collabiteration Manager..."

# Check if bun is available
if command -v bun &> /dev/null; then
    echo "📦 Installing with Bun..."
    bun install
    bun run build
elif command -v npm &> /dev/null; then
    echo "📦 Installing with npm..."
    npm install
    npm run build
else
    echo "❌ Error: Neither bun nor npm found. Please install Node.js/Bun first."
    exit 1
fi

# Make CLI executable
chmod +x bin/git-collabiteration.js

# Create symlink for global usage (optional)
echo "🔗 Creating global symlink..."
INSTALL_DIR="/usr/local/bin"
if [ -w "$INSTALL_DIR" ]; then
    ln -sf "$(pwd)/bin/git-collabiteration.js" "$INSTALL_DIR/git-collabiteration"
    echo "✅ Installed globally as 'git-collabiteration'"
else
    echo "⚠️  Could not install globally (no write permission to $INSTALL_DIR)"
    echo "   You can use: $(pwd)/bin/git-collabiteration.js"
    echo "   Or add to your PATH: export PATH=\"$(pwd)/bin:\$PATH\""
fi

echo ""
echo "✅ Git Collabiteration Manager installed successfully!"
echo ""
echo "🚀 Quick start:"
echo "   cd /path/to/your-project/"
echo "   git-collabiteration init"
echo "   git-collabiteration create my-feature"
echo ""
echo "📚 Full documentation: https://github.com/brkthru/git-collabiteration-manager"