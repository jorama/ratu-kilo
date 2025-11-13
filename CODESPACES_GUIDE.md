# 🚀 Running Ratu in GitHub Codespaces

**Yes! You can run the entire Ratu Sovereign AI platform in GitHub Codespaces!**

---

## ✅ What's Configured

I've added a complete devcontainer configuration that automatically:
- Sets up Node.js 20 environment
- Installs Docker-in-Docker
- Forwards all necessary ports
- Installs dependencies
- Starts infrastructure services
- Configures VS Code extensions

---

## 🎯 Quick Start in Codespaces

### 1. Open in Codespaces

Go to your repository: https://github.com/jorama/ratu-kilo

Click: **Code** → **Codespaces** → **Create codespace on main**

### 2. Wait for Setup (2-3 minutes)

The devcontainer will automatically:
- ✅ Install Node.js dependencies
- ✅ Start Docker services (PostgreSQL, Redis, Qdrant, MinIO)
- ✅ Configure VS Code extensions

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
# You'll need:
# - KIMI_K2_API_KEY
# - EMBEDDINGS_API_KEY (OpenAI)
# - JWT_SECRET (generate with: openssl rand -base64 32)
```

### 4. Initialize Database

```bash
# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Setup marketing chatbot
cd infra/seed && npm run setup-bot
```

### 5. Start Services

Open 4 terminals in Codespaces:

**Terminal 1 - API:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Worker:**
```bash
cd apps/worker
npm run dev
```

**Terminal 3 - Dashboard:**
```bash
cd apps/dashboard
npm run dev
```

**Terminal 4 - Marketing Site:**
```bash
cd apps/website
npm run dev
```

### 6. Access Your Services

Codespaces will automatically forward ports and give you URLs:

- **Marketing Website:** https://[codespace-name]-3000.app.github.dev
- **API Gateway:** https://[codespace-name]-3001.app.github.dev
- **Console:** https://[codespace-name]-3002.app.github.dev
- **Dashboard:** https://[codespace-name]-3003.app.github.dev

---

## 🔧 Forwarded Ports

The devcontainer automatically forwards:

| Port | Service | Label |
|------|---------|-------|
| 3000 | Marketing Website | Public |
| 3001 | API Gateway | Public |
| 3002 | Console | Private |
| 3003 | Dashboard | Private |
| 5432 | PostgreSQL | Private |
| 6333 | Qdrant | Private |
| 6379 | Redis | Private |
| 9000 | MinIO | Private |

---

## 💡 Benefits of Codespaces

### ✅ Zero Local Setup
- No need to install Node.js, Docker, or dependencies
- Everything runs in the cloud
- Consistent environment for all developers

### ✅ Instant Development
- Start coding in seconds
- Pre-configured VS Code
- All extensions installed

### ✅ Powerful Resources
- 4-core CPU
- 8 GB RAM
- 32 GB storage
- Fast SSD

### ✅ Collaboration
- Share your Codespace URL
- Pair programming
- Live collaboration

### ✅ Cost-Effective
- Free tier: 120 core-hours/month
- Pay-as-you-go after that
- Auto-sleep when inactive

---

## 🎨 VS Code Extensions Included

The devcontainer includes:
- ✅ ESLint - Code linting
- ✅ Prettier - Code formatting
- ✅ Tailwind CSS IntelliSense
- ✅ Docker extension
- ✅ Terraform extension

---

## 🐛 Troubleshooting

### Services Not Starting?

```bash
# Check Docker
docker ps

# Restart services
docker-compose restart

# View logs
docker-compose logs -f
```

### Port Already in Use?

Codespaces handles port forwarding automatically. If you see conflicts:
```bash
# Stop all services
docker-compose down

# Start again
docker-compose up -d
```

### Can't Access Forwarded Ports?

1. Go to **Ports** tab in VS Code
2. Right-click the port
3. Select **Port Visibility** → **Public**

---

## 🚀 Production Deployment from Codespaces

You can even deploy to production from Codespaces:

```bash
# Build for production
npm run build

# Deploy to Kubernetes
kubectl apply -f infra/k8s/

# Or deploy with Terraform
cd infra/terraform
terraform init
terraform apply
```

---

## 📊 Resource Usage

### Typical Usage
- **Idle:** ~500 MB RAM
- **Running all services:** ~2-3 GB RAM
- **Under load:** ~4-6 GB RAM

### Recommended Codespace Size
- **Minimum:** 4-core, 8 GB RAM
- **Recommended:** 8-core, 16 GB RAM (for production testing)

---

## 🎯 Quick Commands

```bash
# Install dependencies
npm install

# Start infrastructure
docker-compose up -d

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed

# Setup marketing bot
cd infra/seed && npm run setup-bot

# Start all services
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## 💡 Pro Tips

### 1. Use Multiple Terminals
Open 4-5 terminals for different services

### 2. Enable Auto-Save
Settings → Files: Auto Save → afterDelay

### 3. Use Port Forwarding
All ports are auto-forwarded and accessible via HTTPS

### 4. Commit Often
Codespaces can be deleted, so commit your work frequently

### 5. Use Secrets
Store API keys in Codespace secrets:
Settings → Secrets → New secret

---

## 🎉 Conclusion

**Yes, you can absolutely run Ratu in GitHub Codespaces!**

Benefits:
- ✅ Zero local setup required
- ✅ Consistent development environment
- ✅ Powerful cloud resources
- ✅ Automatic port forwarding
- ✅ Pre-configured VS Code
- ✅ Docker-in-Docker support
- ✅ Perfect for demos and testing

**Just click "Open in Codespaces" and you're ready to go in 2-3 minutes!** 🚀

---

**Repository:** https://github.com/jorama/ratu-kilo
**Devcontainer:** Fully configured ✅
**Ready for:** Instant cloud development! ☁️