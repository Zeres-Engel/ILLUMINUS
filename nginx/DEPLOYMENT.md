# 🚀 ILLUMINUS Wav2Lip Deployment Guide

## 📊 Port Configuration (Tránh Xung Đột)

### **Current Port Usage:**
- **FAMS (fams.io.vn):** 3000, 3001, 3002, 8088, 8081, 27018
- **EcoDesign (ecologicaldesign.tech):** 8080, 8443, 27017
- **Wav2Lip (illuminusw2l.io.vn):** **9000**, 9080, 9443, 9379

### **Wav2Lip Port Mapping:**
```
Service               Internal    External    URL
─────────────────────────────────────────────────────────
FastAPI App          8000    →   9000       http://localhost:9000
Nginx Proxy          80      →   9080       http://localhost:9080  
Nginx SSL            443     →   9443       https://localhost:9443
Redis                6379    →   9379       redis://localhost:9379
```

## 🛠️ Deployment Steps

### 1. **Build và Start Services**
```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 2. **Access URLs**
```bash
# Direct FastAPI access
http://localhost:9000
http://illuminusw2l.io.vn:9000

# Through Nginx (recommended)
http://localhost:9080
http://illuminusw2l.io.vn:9080

# Health check
curl http://localhost:9000/health
```

### 3. **WebSocket Testing**
```bash
# WebSocket endpoint
ws://localhost:9000/ws
ws://illuminusw2l.io.vn:9000/ws

# Through nginx
ws://localhost:9080/ws
ws://illuminusw2l.io.vn:9080/ws
```

## 🔧 Configuration Files Updated

### **Dockerfile Improvements:**
- ✅ Added security (non-root user)
- ✅ Added health checks
- ✅ Optimized dependencies
- ✅ Better directory structure

### **docker-compose.yml Changes:**
- ✅ Port 9000 (was 8000) - FastAPI
- ✅ Port 9080 (nginx) - External access
- ✅ Port 9443 (nginx ssl) - Future HTTPS
- ✅ Port 9379 (redis) - Job queue
- ✅ Added GPU support
- ✅ Added health checks
- ✅ Better volume mapping

### **nginx/conf.d/illuminusw2l.conf:**
- ✅ Domain: illuminusw2l.io.vn
- ✅ WebSocket support
- ✅ Large file uploads (500MB)
- ✅ Extended timeouts
- ✅ Security headers

## 🌐 Domain Configuration

### **DNS Settings:**
```
illuminusw2l.io.vn    A    YOUR_SERVER_IP
www.illuminusw2l.io.vn A   YOUR_SERVER_IP
```

### **Nginx Proxy Setup (Production):**
```bash
# Copy nginx config to system
sudo cp nginx/conf.d/illuminusw2l.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/illuminusw2l.conf /etc/nginx/sites-enabled/

# Update nginx config to point to localhost:9000
sudo sed -i 's/wav2lip-app:8000/localhost:9000/g' /etc/nginx/sites-enabled/illuminusw2l.conf

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## 🐳 Container Management

### **Useful Commands:**
```bash
# View logs
docker-compose logs -f wav2lip-app
docker-compose logs -f nginx

# Restart specific service  
docker-compose restart wav2lip-app

# Update and redeploy
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Clean up
docker-compose down --volumes
docker system prune -f
```

## 🔍 Monitoring & Debugging

### **Health Checks:**
```bash
# Application health
curl http://localhost:9000/health

# Container status
docker-compose ps

# Resource usage
docker stats illuminus_wav2lip
```

### **Log Locations:**
```
Application:    ./logs/app.log
Nginx Access:   /var/log/nginx/illuminusw2l.access.log  
Nginx Error:    /var/log/nginx/illuminusw2l.error.log
Docker:         docker-compose logs [service_name]
```

## ⚠️ Important Notes

1. **Port 9000** is now the main access point (was 8000)
2. **GPU Support** requires nvidia-docker runtime
3. **File Uploads** limited to 500MB (configurable)
4. **WebSocket** timeouts set to 1 hour for long processing
5. **Domain** illuminusw2l.io.vn must point to your server IP

## 🚀 Production Deployment

### **For Production Use:**
1. Set up SSL certificates for port 9443
2. Configure proper domain DNS
3. Set environment variables in `.env` file
4. Enable nginx rate limiting
5. Set up backup for models and uploads
6. Configure log rotation

### **Environment Variables:**
```bash
# Create .env file
cat > .env << EOF
CUDA_VISIBLE_DEVICES=0
NODE_ENV=production
PYTHONPATH=/app
# Add other production settings
EOF
``` 