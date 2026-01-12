#!/bin/bash

echo "Creating test files with versions..."

# Create project test files
mkdir -p project/docs
mkdir -p project/src

# Test case 1: Multiple V-versions (should select V2.1)
echo "Specification V1.0" > "project/docs/specification_V1.0.pdf"
echo "Specification V2.0" > "project/docs/specification_V2.0.pdf"
echo "Specification V2.1" > "project/docs/specification_V2.1.pdf"

# Test case 2: Only X-versions (should select X0.3)
echo "Draft X0.1" > "project/docs/draft_X0.1.docx"
echo "Draft X0.2" > "project/docs/draft_X0.2.docx"
echo "Draft X0.3" > "project/docs/draft_X0.3.docx"

# Test case 3: Mixed V and X (should select V1.0, ignore X)
echo "Report V1.0" > "project/docs/report_V1.0.txt"
echo "Report X0.5" > "project/docs/report_X0.5.txt"
echo "Report X0.9" > "project/docs/report_X0.9.txt"

# Test case 4: No version (should include)
echo "README without version" > "project/README.md"
echo "Config without version" > "project/config.json"

# Test case 5: Code files with versions
echo "# API V2.0" > "project/src/api_V2.0.py"
echo "# API X1.0" > "project/src/api_X1.0.py"

# Create reference test files
mkdir -p reference/ISO
mkdir -p reference/DIN

echo "ISO 9001 V2015" > "reference/ISO/ISO-9001_V2015.pdf"
echo "ISO 9001 V2018" > "reference/ISO/ISO-9001_V2018.pdf"
echo "DIN Standard X1.2" > "reference/DIN/DIN-Standard_X1.2.pdf"

echo "✓ Test files created!"
echo ""
echo "Expected results:"
echo "- specification: V2.1 (latest V-version)"
echo "- draft: X0.3 (latest X-version, no V-versions)"
echo "- report: V1.0 (V-version preferred over X)"
echo "- README, config: included (no versions)"
echo "- api: V2.0 (V-version preferred)"
echo "- ISO-9001: V2018 (latest V-version)"
echo "- DIN-Standard: X1.2 (only X-version)"