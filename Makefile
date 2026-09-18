# Hustle Makefile - Development and Operations Commands

.PHONY: help
help: ## Show this help message
	@echo "Hustle - Youth Soccer Stats Platform"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'

#===============================================================================
# Development
#===============================================================================

.PHONY: dev
dev: ## Start development server
	@echo "🚀 Starting dev server..."
	@npm run dev

.PHONY: build
build: ## Build for production
	@echo "🏗️  Building for production..."
	@npm run build

.PHONY: test
test: ## Run all tests
	@echo "🧪 Running tests..."
	@npm test

.PHONY: lint
lint: ## Run linter
	@echo "🔍 Running linter..."
	@npm run lint

#===============================================================================
# Clean
#===============================================================================

.PHONY: clean
clean: ## Clean all temporary files
	@echo "🧹 Cleaning all temporary files..."
	@rm -rf tmp/
	@rm -rf .next/
	@echo "✅ Cleaned"
