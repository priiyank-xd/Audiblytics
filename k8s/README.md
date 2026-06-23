# Audiblytics Kubernetes manifests

Layout:

```
k8s/
  base/                 # Shared Deployments, Services, ConfigMaps
  components/           # Reusable kustomize components (seed job)
  overlays/production/  # Production patches, Ingress, TLS, GHCR images
  overlays/seed/        # One-time seed job with GHCR image refs
  infra/                # Cluster bootstrap (cert-manager issuer)
  secrets.yaml.example  # Copy locally — never commit secrets.yaml
```

Traffic flows **Internet → Ingress (TLS) → web:3000 → api:8000** (internal). The API Service is not exposed publicly; Next.js proxies `/api/v1/*`.

## Prerequisites

- Cluster with kubectl access (Oracle k3s/OKE or local)
- Neon `DATABASE_URL`, Cloudflare R2 keys, Gemini API key, JWT secret
- Container images built for your node architecture (Oracle Ampere → `linux/arm64`)
- DNS A record pointing `YOUR_DOMAIN` at the cluster ingress public IP

## Cluster bootstrap (once per cluster)

Install ingress-nginx and cert-manager on k3s, then apply the Let's Encrypt issuer.

```bash
# ingress-nginx (k3s — disable Traefik first if installed)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/cloud/deploy.yaml

# cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.2/cert-manager.yaml
kubectl -n cert-manager wait --for=condition=Available deployment/cert-manager --timeout=120s

# ClusterIssuer — edit YOUR_EMAIL first
kubectl apply -f k8s/infra/cluster-issuer.yaml
```

Wait for the ingress controller LoadBalancer/NodePort external IP, then point DNS at it.

## One-time app setup

1. Copy and fill secrets (not applied by kustomize):

   ```bash
   cp k8s/secrets.yaml.example k8s/secrets.yaml
   # edit k8s/secrets.yaml
   kubectl apply -f k8s/secrets.yaml
   ```

2. Replace placeholders in production overlay (use the **same hostname** everywhere):
   - `k8s/overlays/production/configmap-patch.yaml` — `CORS_ORIGINS: "https://YOUR_DOMAIN"`
   - `k8s/overlays/production/ingress.yaml` — `YOUR_DOMAIN` (hostname only, no `https://`)
   - `k8s/infra/cluster-issuer.yaml` — `YOUR_EMAIL`

## Deploy

```bash
kubectl apply -k k8s/overlays/production
# or equivalently:
kubectl apply -k k8s/
```

cert-manager creates the `audiblytics-tls` secret automatically after DNS propagates and HTTP-01 validation succeeds.

## Seed admin user (once)

After the API pod is healthy:

```bash
kubectl apply -k k8s/overlays/seed
kubectl -n audiblytics wait --for=condition=complete job/audiblytics-seed --timeout=120s
```

Re-running the seed job creates a duplicate user if the email already exists — only run once per environment.

## Verify

```bash
kubectl -n audiblytics get pods,svc,ingress
kubectl -n audiblytics describe certificate audiblytics-tls
kubectl -n audiblytics logs deploy/audiblytics-api -c api --tail=50
kubectl -n audiblytics logs deploy/audiblytics-web --tail=50
curl -I "https://YOUR_DOMAIN"
```

## Container images (GHCR)

Production manifests pull from GitHub Container Registry:

| Image | GHCR path |
|-------|-----------|
| API | `ghcr.io/priiyank-xd/audiblytics-api:latest` |
| Web | `ghcr.io/priiyank-xd/audiblytics-web:latest` |

Tag is pinned at deploy time by `.github/workflows/deploy.yml` (git SHA). The overlay default is `latest` for local/manual deploys.

## GitHub Actions CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci-web.yml` | PR/push to `apps/web/**` | lint, typecheck, test, build |
| `ci-api.yml` | PR/push to `apps/api/**` | pytest |
| `api-migrations.yml` | PR/push to `apps/api/**` | Alembic against Postgres |
| `deploy.yml` | push to `main` (+ manual) | build ARM64 → GHCR → `kubectl apply` |

### Deploy secret (repository)

Create **`KUBE_CONFIG`**: base64-encoded kubeconfig for your Oracle k3s cluster.

```bash
base64 -i ~/.kube/config | pbcopy   # macOS
# Settings → Secrets and variables → Actions → New repository secret → KUBE_CONFIG
```

Migrations run automatically via the API Deployment init container on each rollout.

Optional: add a GitHub **environment** named `production` to `deploy.yml` for manual approval before apply.

Create the `ghcr-pull` secret before deploy if packages are private — see `k8s/secrets.yaml.example`. If GHCR packages are **public**, remove the `imagePullSecrets` block from `k8s/overlays/production/image-patch.yaml` and `k8s/overlays/seed/image-patch.yaml`.

Build and push locally (Oracle Ampere → arm64):

```bash
docker buildx build --platform linux/arm64 -t ghcr.io/priiyank-xd/audiblytics-api:latest --push apps/api
docker buildx build --platform linux/arm64 \
  --build-arg NEXT_PUBLIC_STORAGE_BACKEND=api \
  --build-arg NEXT_PUBLIC_AUDIBLYTICS_PERSONAL_USE=true \
  -t ghcr.io/priiyank-xd/audiblytics-web:latest --push apps/web
```

## Image tags

Legacy local tags (`audiblytics-api`, `audiblytics-web` in `k8s/base/`) are rewritten to GHCR by the production overlay.
