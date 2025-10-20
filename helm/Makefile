# Makefile for luckygo Helm Chart

# Variables
CHART_NAME = luckygo
NAMESPACE = luckygo
RELEASE_NAME = luckygo
HELM_CHART_PATH = ./helm/luckygo

# Docker images
FRONTEND_IMAGE = luckygo/frontend
BACKEND_IMAGE = luckygo/backend
IMAGE_TAG ?= latest
REGISTRY ?= your-registry.com

# Helm commands
HELM = helm
KUBECTL = kubectl

.PHONY: help
help: ## Display this help message
	@echo "luckygo Helm Chart Makefile"
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: build-images
build-images: ## Build Docker images
	@echo "Building frontend image..."
	cd frontend && docker build -t $(REGISTRY)/$(FRONTEND_IMAGE):$(IMAGE_TAG) .
	@echo "Building backend image..."
	docker build -t $(REGISTRY)/$(BACKEND_IMAGE):$(IMAGE_TAG) .

.PHONY: push-images
push-images: ## Push Docker images to registry
	@echo "Pushing frontend image..."
	docker push $(REGISTRY)/$(FRONTEND_IMAGE):$(IMAGE_TAG)
	@echo "Pushing backend image..."
	docker push $(REGISTRY)/$(BACKEND_IMAGE):$(IMAGE_TAG)

.PHONY: create-namespace
create-namespace: ## Create Kubernetes namespace
	$(KUBECTL) create namespace $(NAMESPACE) --dry-run=client -o yaml | $(KUBECTL) apply -f -

.PHONY: lint
lint: ## Lint Helm chart
	$(HELM) lint $(HELM_CHART_PATH)

.PHONY: template
template: ## Generate Kubernetes manifests from Helm chart
	$(HELM) template $(RELEASE_NAME) $(HELM_CHART_PATH) --namespace $(NAMESPACE)

.PHONY: template-dev
template-dev: ## Generate Kubernetes manifests for development
	$(HELM) template $(RELEASE_NAME) $(HELM_CHART_PATH) \
		--namespace $(NAMESPACE) \
		--values $(HELM_CHART_PATH)/../values-development.yaml

.PHONY: template-prod
template-prod: ## Generate Kubernetes manifests for production
	$(HELM) template $(RELEASE_NAME) $(HELM_CHART_PATH) \
		--namespace $(NAMESPACE) \
		--values $(HELM_CHART_PATH)/../values-production.yaml

.PHONY: dry-run-dev
dry-run-dev: ## Dry run installation for development
	$(HELM) install $(RELEASE_NAME) $(HELM_CHART_PATH) \
		--namespace $(NAMESPACE) \
		--values $(HELM_CHART_PATH)/../values-development.yaml \
		--dry-run --debug

.PHONY: dry-run-prod
dry-run-prod: ## Dry run installation for production
	$(HELM) install $(RELEASE_NAME) $(HELM_CHART_PATH) \
		--namespace $(NAMESPACE) \
		--values $(HELM_CHART_PATH)/../values-production.yaml \
		--dry-run --debug

.PHONY: install-dev
install-dev: create-namespace ## Install Helm chart for development
	$(HELM) install $(RELEASE_NAME) $(HELM_CHART_PATH) \
		--namespace $(NAMESPACE) \
		--values $(HELM_CHART_PATH)/../values-development.yaml \
		--wait --timeout=10m

.PHONY: install-prod
install-prod: create-namespace ## Install Helm chart for production
	$(HELM) install $(RELEASE_NAME) $(HELM_CHART_PATH) \
		--namespace $(NAMESPACE) \
		--values $(HELM_CHART_PATH)/../values-production.yaml \
		--wait --timeout=15m

.PHONY: upgrade-dev
upgrade-dev: ## Upgrade Helm release for development
	$(HELM) upgrade $(RELEASE_NAME) $(HELM_CHART_PATH) \
		--namespace $(NAMESPACE) \
		--values $(HELM_CHART_PATH)/../values-development.yaml \
		--wait --timeout=10m

.PHONY: upgrade-prod
upgrade-prod: ## Upgrade Helm release for production
	$(HELM) upgrade $(RELEASE_NAME) $(HELM_CHART_PATH) \
		--namespace $(NAMESPACE) \
		--values $(HELM_CHART_PATH)/../values-production.yaml \
		--wait --timeout=15m

.PHONY: status
status: ## Show Helm release status
	$(HELM) status $(RELEASE_NAME) --namespace $(NAMESPACE)

.PHONY: test
test: ## Run Helm tests
	$(HELM) test $(RELEASE_NAME) --namespace $(NAMESPACE)

.PHONY: rollback
rollback: ## Rollback to previous release
	$(HELM) rollback $(RELEASE_NAME) --namespace $(NAMESPACE)

.PHONY: uninstall
uninstall: ## Uninstall Helm release
	$(HELM) uninstall $(RELEASE_NAME) --namespace $(NAMESPACE)

.PHONY: logs-frontend
logs-frontend: ## Show frontend logs
	$(KUBECTL) logs -n $(NAMESPACE) -l app.kubernetes.io/component=frontend -f

.PHONY: logs-backend
logs-backend: ## Show backend logs
	$(KUBECTL) logs -n $(NAMESPACE) -l app.kubernetes.io/component=backend -f

.PHONY: logs-redis
logs-redis: ## Show Redis logs
	$(KUBECTL) logs -n $(NAMESPACE) -l app.kubernetes.io/name=redis -f

.PHONY: describe-pods
describe-pods: ## Describe all pods
	$(KUBECTL) describe pods -n $(NAMESPACE)

.PHONY: get-pods
get-pods: ## Get pod status
	$(KUBECTL) get pods -n $(NAMESPACE) -o wide

.PHONY: get-services
get-services: ## Get service status
	$(KUBECTL) get services -n $(NAMESPACE)

.PHONY: get-ingress
get-ingress: ## Get ingress status
	$(KUBECTL) get ingress -n $(NAMESPACE)

.PHONY: port-forward-frontend
port-forward-frontend: ## Port forward to frontend service
	$(KUBECTL) port-forward -n $(NAMESPACE) svc/$(RELEASE_NAME)-frontend 8080:80

.PHONY: port-forward-backend
port-forward-backend: ## Port forward to backend service
	$(KUBECTL) port-forward -n $(NAMESPACE) svc/$(RELEASE_NAME)-backend 3001:3001

.PHONY: shell-frontend
shell-frontend: ## Get shell access to frontend pod
	$(KUBECTL) exec -it -n $(NAMESPACE) deployment/$(RELEASE_NAME)-frontend -- /bin/sh

.PHONY: shell-backend
shell-backend: ## Get shell access to backend pod
	$(KUBECTL) exec -it -n $(NAMESPACE) deployment/$(RELEASE_NAME)-backend -- /bin/bash

.PHONY: scale-frontend
scale-frontend: ## Scale frontend deployment (use REPLICAS=n)
	$(KUBECTL) scale deployment $(RELEASE_NAME)-frontend -n $(NAMESPACE) --replicas=$(REPLICAS)

.PHONY: scale-backend
scale-backend: ## Scale backend deployment (use REPLICAS=n)
	$(KUBECTL) scale deployment $(RELEASE_NAME)-backend -n $(NAMESPACE) --replicas=$(REPLICAS)

.PHONY: clean
clean: uninstall ## Clean up everything
	$(KUBECTL) delete namespace $(NAMESPACE) --ignore-not-found=true

.PHONY: package
package: ## Package Helm chart
	$(HELM) package $(HELM_CHART_PATH) --destination ./dist/

.PHONY: dependency-update
dependency-update: ## Update Helm dependencies
	$(HELM) dependency update $(HELM_CHART_PATH)

# CI/CD targets
.PHONY: ci-build
ci-build: build-images push-images ## CI: Build and push images

.PHONY: ci-deploy-dev
ci-deploy-dev: lint dry-run-dev install-dev test ## CI: Deploy to development

.PHONY: ci-deploy-prod
ci-deploy-prod: lint dry-run-prod install-prod test ## CI: Deploy to production

.DEFAULT_GOAL := help
