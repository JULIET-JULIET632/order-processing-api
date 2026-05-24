# PLAT-047 — GitOps-Driven Kubernetes Platform with Automated Rollbacks

## Overview
Production-grade GitOps deployment pipeline built on Kubernetes (k3s) with ArgoCD for continuous delivery, Argo Rollouts for canary deployments, and automated rollback triggered by Prometheus metrics.

## Stack
| Tool | Purpose |
|---|---|
| k3s | Lightweight Kubernetes cluster |
| ArgoCD | GitOps controller — watches GitHub, deploys automatically |
| Argo Rollouts | Canary deployments with automatic rollback |
| Helm | Kubernetes package manager |
| Prometheus | Metrics collection and analysis |
| Grafana | Visualization dashboard |
| GitHub Actions | CI pipeline — build, tag, push, update |
| DockerHub | Container registry |

## How to Deploy
Any push to main branch triggers the full pipeline automatically. No manual kubectl commands required.

## Access Points
| Service | URL |
|---|---|
| Application | http://3.92.135.206/health |
| ArgoCD UI | https://3.92.135.206:31722 |
| Grafana | http://3.92.135.206:32433 |
| Prometheus | http://3.92.135.206:30090 |

## Canary Strategy
- Step 1: 10% traffic to new version
- Step 2: Prometheus analysis (error rate < 1%, p95 < 500ms)
- Step 3: 50% traffic if analysis passed
- Step 4: Prometheus analysis again
- Step 5: 100% promotion if all passed
- Automatic rollback if any analysis fails

## Project Structure
order-processing-api/
├── app/                    Node.js REST API
├── chart/                  Helm chart
│   └── templates/          Kubernetes manifests
├── .github/workflows/      GitHub Actions CI
└── argocd-app.yaml         ArgoCD application

## Acceptance Criteria
- [x] git push deploys automatically with zero manual steps
- [x] Canary rollout observable in ArgoCD UI
- [x] Broken image triggers automatic rollback
- [x] All resources defined in Git — nothing applied manually
- [x] Grafana dashboard shows real-time metrics
