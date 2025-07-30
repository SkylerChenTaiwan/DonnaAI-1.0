#!/bin/bash

# Script to replace Ionicons imports with Icon component
# This script will:
# 1. Replace import statements
# 2. Update component usage from <Ionicons to <Icon

echo "Starting Ionicons replacement..."

# Find all TypeScript/TSX files and replace the import statement
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  # Skip the Icon.tsx file itself
  if [[ "$file" == *"Icon.tsx" ]]; then
    continue
  fi
  
  # Check if file contains Ionicons import
  if grep -q "import.*Ionicons.*from.*@expo/vector-icons" "$file"; then
    echo "Processing: $file"
    
    # Replace the import statement
    sed -i '' "s/import { Ionicons } from '@expo\/vector-icons';/import { Icon } from '@\/components\/common\/Icon';/g" "$file"
    
    # Replace component usage
    sed -i '' "s/<Ionicons /<Icon /g" "$file"
    sed -i '' "s/<Ionicons$/<Icon/g" "$file"
  fi
done

echo "Ionicons replacement complete!"