#!/bin/bash

echo "Testing version filtering..."
echo ""

# Create test files
./create_test_files.sh

echo ""
echo "Starting Docker containers..."
docker-compose up -d

echo ""
echo "Waiting for backend to start..."
sleep 5

echo ""
echo "Testing /directories/project endpoint..."
curl -s http://localhost:8000/directories/project | jq '
{
  file_count: .file_count,
  files: [.files[] | {
    name: .name,
    version: .version,
    type: .version_type,
    released: .is_released
  }]
}'

echo ""
echo "Testing /directories/reference endpoint..."
curl -s http://localhost:8000/directories/reference | jq '
{
  file_count: .file_count,
  files: [.files[] | {
    name: .name,
    version: .version,
    type: .version_type
  }]
}'

echo ""
echo "Testing refresh endpoint..."
curl -s -X POST http://localhost:8000/directories/refresh | jq

echo ""
echo "✓ Tests complete!"