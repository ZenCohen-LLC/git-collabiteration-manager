#!/bin/bash
# /resume-iteration command implementation

echo "I'll check for available iterations to resume..."
echo ""
echo "Looking for collabiterations directory relative to current location..."
echo ""

# Function to check and list iterations
check_directory() {
    local dir=$1
    if [ -d "$dir" ]; then
        echo "✅ Found collabiterations at: $dir"
        echo ""
        echo "Available iterations:"
        
        local count=0
        for iteration in "$dir"/*; do
            if [ -d "$iteration" ]; then
                local name=$(basename "$iteration")
                ((count++))
                
                # Check for iteration plan
                if [ -f "$iteration/ITERATION_PLAN.md" ] || [ -f "$iteration/CUSTOM_PACING_ITERATION_PLAN.md" ]; then
                    echo "$count. $name (has iteration plan)"
                else
                    echo "$count. $name"
                fi
            fi
        done
        
        if [ $count -eq 0 ]; then
            echo "No iterations found in $dir"
            return 1
        fi
        
        echo ""
        echo "To resume an iteration, I will:"
        echo "1. Read its planning documents and context"
        echo "2. Check current state and progress"
        echo "3. Continue from where we left off"
        echo ""
        echo "Which iteration would you like to resume?"
        return 0
    fi
    return 1
}

# Check in priority order
if check_directory "./collabiterations"; then
    exit 0
elif check_directory "../collabiterations"; then
    exit 0
elif check_directory "./.git-collabiterations"; then
    exit 0
else
    echo "❌ No collabiterations directory found relative to current location."
    echo ""
    echo "I checked:"
    echo "- ./collabiterations/"
    echo "- ../collabiterations/"
    echo "- ./.git-collabiterations/"
    echo ""
    echo "To create a new iteration, use: /iterate"
    echo ""
    echo "Expected structure:"
    echo "your-project/"
    echo "├── collabiterations/"
    echo "│   ├── iteration-name/"
    echo "│   │   └── ITERATION_PLAN.md"
    echo "│   └── ..."
    echo "└── ..."
fi