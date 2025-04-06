.PHONY: install dev build preview docker-build docker-run docker-run-detached docker-up docker-down docker-stop docker-rm docker-logs docker-ps docker-inspect docker-processes docker-network docker-push docker-push-version clean help

# Default target
.DEFAULT_GOAL := help

# Variables
DOCKER_IMAGE_NAME ?= modern-start-page
DOCKER_PORT ?= 4000
CONFIG_DIR ?= ./data
DOCKER_COMPOSE = docker-compose --env-file .env
DOCKER_REGISTRY ?= docker.io
DOCKER_USERNAME ?= $(shell whoami)
VERSION ?= latest

help: ## Display this help message
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build the application
	npm run build

preview: ## Preview the production build
	npm run preview

docker-build: ## Build Docker image
	docker build -t $(DOCKER_IMAGE_NAME) .

docker-run: docker-stop docker-rm docker-build ## Run Docker container in interactive mode
	@echo "Starting container $(DOCKER_IMAGE_NAME)..."
	docker run -p $(DOCKER_PORT):4000 \
		-v $(CONFIG_DIR):/app/data \
		--env-file .env \
		--name $(DOCKER_IMAGE_NAME) \
		-it $(DOCKER_IMAGE_NAME)

docker-run-detached: docker-stop docker-rm docker-build ## Run Docker container in detached mode
	@echo "Starting container $(DOCKER_IMAGE_NAME) in detached mode..."
	docker run -d \
		-p $(DOCKER_PORT):4000 \
		-v $(CONFIG_DIR):/app/data \
		--env-file .env \
		--name $(DOCKER_IMAGE_NAME) \
		$(DOCKER_IMAGE_NAME)

docker-stop: ## Stop all running containers for this image
	@echo "Stopping container $(DOCKER_IMAGE_NAME)..."
	docker stop $$(docker ps -q --filter name=$(DOCKER_IMAGE_NAME)) || true

docker-rm: ## Remove any existing containers for this image
	@echo "Removing container $(DOCKER_IMAGE_NAME)..."
	docker rm -f $$(docker ps -aq --filter name=$(DOCKER_IMAGE_NAME)) || true

docker-logs: ## Show container logs
	@if docker ps -q --filter name=$(DOCKER_IMAGE_NAME) > /dev/null; then \
		docker logs $(DOCKER_IMAGE_NAME); \
	else \
		echo "Container $(DOCKER_IMAGE_NAME) is not running. Try 'make docker-run-detached' first."; \
	fi

docker-ps: ## Show running containers
	docker ps -a | grep $(DOCKER_IMAGE_NAME) || echo "No containers found for $(DOCKER_IMAGE_NAME)"

docker-inspect: ## Inspect container details
	@if docker ps -q --filter name=$(DOCKER_IMAGE_NAME) > /dev/null; then \
		docker inspect $(DOCKER_IMAGE_NAME); \
	else \
		echo "Container $(DOCKER_IMAGE_NAME) is not running. Try 'make docker-run-detached' first."; \
	fi

docker-processes: ## Show processes running in container
	@if docker ps -q --filter name=$(DOCKER_IMAGE_NAME) > /dev/null; then \
		docker exec $(DOCKER_IMAGE_NAME) ps aux; \
	else \
		echo "Container $(DOCKER_IMAGE_NAME) is not running. Try 'make docker-run-detached' first."; \
	fi

docker-network: ## Show network configuration and listening ports
	@if docker ps -q --filter name=$(DOCKER_IMAGE_NAME) > /dev/null; then \
		echo "Container network information:"; \
		docker exec $(DOCKER_IMAGE_NAME) netstat -tulpn; \
		echo -e "\nContainer port mappings:"; \
		docker port $(DOCKER_IMAGE_NAME); \
	else \
		echo "Container $(DOCKER_IMAGE_NAME) is not running. Try 'make docker-run-detached' first."; \
	fi

docker-up: ## Start the application using Docker Compose
	DOCKER_IMAGE_NAME=$(DOCKER_IMAGE_NAME) DOCKER_PORT=$(DOCKER_PORT) CONFIG_DIR=$(CONFIG_DIR) docker-compose up -d

docker-down: ## Stop and remove containers using Docker Compose
	DOCKER_IMAGE_NAME=$(DOCKER_IMAGE_NAME) DOCKER_PORT=$(DOCKER_PORT) CONFIG_DIR=$(CONFIG_DIR) docker-compose down

docker-push: docker-build ## Push Docker image to registry with latest tag
	@echo "Pushing image $(DOCKER_IMAGE_NAME) to $(DOCKER_REGISTRY)/$(DOCKER_USERNAME)/$(DOCKER_IMAGE_NAME):latest..."
	docker tag $(DOCKER_IMAGE_NAME) $(DOCKER_REGISTRY)/$(DOCKER_USERNAME)/$(DOCKER_IMAGE_NAME):latest
	docker push $(DOCKER_REGISTRY)/$(DOCKER_USERNAME)/$(DOCKER_IMAGE_NAME):latest

docker-push-version: docker-build ## Push Docker image to registry with version tag (e.g., make docker-push-version VERSION=v1.0.0)
	@echo "Pushing image $(DOCKER_IMAGE_NAME) to $(DOCKER_REGISTRY)/$(DOCKER_USERNAME)/$(DOCKER_IMAGE_NAME):$(VERSION)..."
	docker tag $(DOCKER_IMAGE_NAME) $(DOCKER_REGISTRY)/$(DOCKER_USERNAME)/$(DOCKER_IMAGE_NAME):$(VERSION)
	docker push $(DOCKER_REGISTRY)/$(DOCKER_USERNAME)/$(DOCKER_IMAGE_NAME):$(VERSION)

clean: ## Clean up build artifacts and dependencies
	rm -rf dist
	rm -rf node_modules
	docker rmi $(DOCKER_IMAGE_NAME) || true
	docker rmi $(DOCKER_REGISTRY)/$(DOCKER_USERNAME)/$(DOCKER_IMAGE_NAME):latest || true
	docker rmi $(DOCKER_REGISTRY)/$(DOCKER_USERNAME)/$(DOCKER_IMAGE_NAME):$(VERSION) || true 