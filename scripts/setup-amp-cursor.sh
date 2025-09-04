#!/bin/bash

# AMP (Sourcegraph) Setup for Cursor

echo "🤖 Setting up AMP in Cursor"
echo "=========================="

# Install Sourcegraph/Cody extension
echo "Installing Sourcegraph Cody extension..."
cursor --install-extension sourcegraph.cody-ai || echo "Note: You may need to install manually from Cursor marketplace"

echo ""
echo "📋 Manual Steps Required:"
echo ""
echo "1. Open Cursor"
echo "2. Press Cmd+Shift+P → 'Cody: Sign In'"
echo "3. Use your Sourcegraph token:"
echo "   sgp_ws019830ca9f607852933114c2ad580470_214da7a9130f431f5aa65810fc074bc331cdda48"
echo ""
echo "4. Once signed in, AMP features include:"
echo "   - AI autocomplete as you type"
echo "   - Chat with codebase understanding"
echo "   - Autonomous code generation"
echo "   - Explain code functionality"
echo "   - Generate unit tests"
echo "   - Fix bugs automatically"
echo ""
echo "5. Try these AMP commands:"
echo "   - Select code → Right-click → 'Cody: Explain'"
echo "   - Type comment → Wait for AMP to suggest code"
echo "   - Ask in chat: 'Generate tests for this function'"
echo ""
echo "🚀 AMP is the next-gen AI coding assistant!"