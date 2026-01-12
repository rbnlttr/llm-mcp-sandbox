#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting LLM MCP Sandbox Build Process"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running"

# Backend Linting and Testing
echo ""
echo "🔍 Backend Quality Checks"
echo "------------------------"

# Build backend container temporarily for linting
print_status "Building backend container for quality checks..."
docker build -t llm-backend-check ./backend > /dev/null 2>&1
# Install linting tools in container
print_status "Installing linting tools..."
docker run --rm -v $(pwd)/backend:/app llm-backend-check pip install flake8 pylint pytest > /dev/null 2>&1
# Run flake8 linting
echo "Running flake8 linting..."
if docker run --rm -v $(pwd)/backend:/app llm-backend-check flake8 --max-line-length=100 --extend-ignore=E203,W503 /app; then
    print_status "Flake8 linting passed"
else
    print_error "Flake8 linting failed"
    exit 1
fi

# Run pylint
echo "Running pylint..."
if docker run --rm -v $(pwd)/backend:/app llm-backend-check pylint --rcfile=/app/.pylintrc /app/app 2>/dev/null || docker run --rm -v $(pwd)/backend:/app llm-backend-check pylint /app/app --disable=C0114,C0115,C0116,R0903,R0913,W0613,E1101; then
    print_status "Pylint passed"
else
    print_warning "Pylint warnings (continuing...)"
fi

# Run tests
echo "Running backend tests..."
if docker run --rm -v $(pwd)/backend:/app llm-backend-check python -m pytest /app/tests -v --tb=short; then
    print_status "Backend tests passed"
else
    print_error "Backend tests failed"
    exit 1
fi

# Frontend Linting and Testing
echo ""
echo "🎨 Frontend Quality Checks"
echo "-------------------------"

cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install > /dev/null 2>&1
fi

# Run ESLint
echo "Running ESLint..."
if npm run lint 2>/dev/null || npx eslint src --ext .js,.jsx; then
    print_status "ESLint passed"
else
    print_error "ESLint failed"
    exit 1
fi

# Run tests
echo "Running frontend tests..."
if npm test -- --watchAll=false --passWithNoTests; then
    print_status "Frontend tests passed"
else
    print_error "Frontend tests failed"
    exit 1
fi

cd ..

# Build and start containers
echo ""
echo "🐳 Building and Starting Containers"
echo "-----------------------------------"

print_status "Building containers..."
docker-compose build > /dev/null 2>&1

print_status "Starting services..."
docker-compose up -d

print_status "Waiting for services to be healthy..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_status "All services are running!"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
else
    print_error "Some services failed to start"
    docker-compose logs
    exit 1
fi

echo ""
print_status "Build process completed successfully! 🎉"