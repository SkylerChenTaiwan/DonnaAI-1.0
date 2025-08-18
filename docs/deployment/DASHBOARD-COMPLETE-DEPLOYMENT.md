# DonnaAI Dashboard 完整部署指南

## 📋 總覽

本指南提供 DonnaAI Dashboard Analytics Integration 系統的完整部署流程，包含前端、後端 API、WebSocket 服務和資料庫配置。

## 🏗️ 系統架構總覽

```mermaid
graph TB
    subgraph "用戶層"
        U1[Web 用戶]
        U2[Mobile 用戶]
        U3[Admin 用戶]
    end
    
    subgraph "負載平衡"
        LB[Load Balancer/CDN]
    end
    
    subgraph "前端服務"
        FE1[Next.js App 1]
        FE2[Next.js App 2]
        FE3[Next.js App N]
    end
    
    subgraph "後端服務"
        API1[API Server 1]
        API2[API Server 2]
        WS1[WebSocket Server 1]
        WS2[WebSocket Server 2]
    end
    
    subgraph "快取層"
        REDIS[(Redis Cluster)]
    end
    
    subgraph "資料層"
        FB[(Firebase/Firestore)]
        LOGS[(日誌系統)]
    end
    
    subgraph "監控"
        MON[監控系統]
        ALERT[警報系統]
    end
    
    U1 --> LB
    U2 --> LB
    U3 --> LB
    
    LB --> FE1
    LB --> FE2
    LB --> FE3
    
    FE1 --> API1
    FE1 --> WS1
    FE2 --> API2
    FE2 --> WS2
    
    API1 --> REDIS
    API2 --> REDIS
    WS1 --> REDIS
    WS2 --> REDIS
    
    API1 --> FB
    API2 --> FB
    
    MON --> API1
    MON --> API2
    MON --> WS1
    MON --> WS2
    MON --> REDIS
    MON --> FB
    
    ALERT --> MON
    
    API1 --> LOGS
    API2 --> LOGS
    WS1 --> LOGS
    WS2 --> LOGS
```

## 🚀 部署環境準備

### 1. 伺服器需求

#### 生產環境最低需求
- **CPU**: 4 核心以上
- **Memory**: 8GB RAM 以上
- **Storage**: 50GB SSD 以上
- **Network**: 100Mbps 上下行
- **OS**: Ubuntu 20.04 LTS 或 CentOS 8

#### 推薦配置
- **CPU**: 8 核心
- **Memory**: 16GB RAM
- **Storage**: 100GB SSD
- **Network**: 1Gbps 上下行

### 2. 依賴服務安裝

```bash
#!/bin/bash
# setup-environment.sh

set -e

echo "🚀 開始設置 DonnaAI Dashboard 部署環境..."

# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝基本工具
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx

# 安裝 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安裝 PM2
npm install -g pm2

# 安裝 Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 安裝 Docker (選用)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "✅ 環境設置完成！"
```

## 📦 應用程式部署

### 1. 代碼部署

```bash
#!/bin/bash
# deploy-app.sh

APP_DIR="/opt/donnaai"
REPO_URL="https://github.com/your-org/DonnaAI-1.0.git"
BRANCH="main"

echo "📦 開始部署 DonnaAI Dashboard..."

# 建立應用目錄
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 克隆或更新代碼
if [ -d "$APP_DIR/.git" ]; then
    echo "更新現有代碼..."
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/$BRANCH
else
    echo "克隆新代碼..."
    git clone -b $BRANCH $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# 安裝依賴
echo "安裝 Node.js 依賴..."
npm ci

# 建立必要目錄
mkdir -p logs
mkdir -p data/uploads
mkdir -p data/cache

echo "✅ 代碼部署完成！"
```

### 2. 環境變數配置

```bash
# .env.production
# ===================
# 🔧 基本配置
# ===================
NODE_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# ===================
# 🌐 網路配置
# ===================
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com
NEXT_PUBLIC_APP_URL=https://dashboard.yourdomain.com

# ===================
# 🔐 認證配置
# ===================
JWT_SECRET=your_super_secure_jwt_secret_min_64_chars_long_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://dashboard.yourdomain.com

# ===================
# 🔥 Firebase 配置
# ===================
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# ===================
# 🗃️ Redis 配置
# ===================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_CLUSTER_NODES=redis1:6379,redis2:6379,redis3:6379

# ===================
# 📡 WebSocket 配置
# ===================
WS_PORT=3001
WS_HOST=0.0.0.0
WS_MAX_CONNECTIONS=1000
WS_HEARTBEAT_INTERVAL=30000

# ===================
# 📊 監控配置
# ===================
ENABLE_METRICS=true
METRICS_PORT=3002
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# ===================
# 🎯 效能配置
# ===================
MAX_UPLOAD_SIZE=10485760
API_RATE_LIMIT=100
CACHE_TTL=300

# ===================
# 📧 通知配置
# ===================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
```

### 3. Next.js 應用建構

```bash
#!/bin/bash
# build-app.sh

cd /opt/donnaai

echo "🏗️ 建構 Next.js 應用..."

# 設定環境變數
export NODE_ENV=production

# 清理舊建構
rm -rf .next
rm -rf out

# 建構應用
npm run build

# 確認建構成功
if [ $? -eq 0 ]; then
    echo "✅ 應用建構成功！"
else
    echo "❌ 應用建構失敗！"
    exit 1
fi

# 建構統計
du -sh .next
ls -la .next
```

### 4. PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    // Next.js 應用
    {
      name: 'donnaai-dashboard',
      script: 'npm',
      args: 'start',
      cwd: '/opt/donnaai',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // 效能設定
      max_memory_restart: '2G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // 日誌設定
      log_file: '/opt/donnaai/logs/dashboard.log',
      out_file: '/opt/donnaai/logs/dashboard-out.log',
      error_file: '/opt/donnaai/logs/dashboard-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 健康檢查
      health_check_grace_period: 10000,
    },
    
    // WebSocket 服務
    {
      name: 'donnaai-websocket',
      script: './server/websocket-server.js',
      cwd: '/opt/donnaai',
      instances: 4,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        WS_PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        WS_PORT: 3001
      },
      // 效能設定
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // 日誌設定
      log_file: '/opt/donnaai/logs/websocket.log',
      out_file: '/opt/donnaai/logs/websocket-out.log',
      error_file: '/opt/donnaai/logs/websocket-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    }
  ],
  
  // 部署配置
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['dashboard.yourdomain.com'],
      ref: 'origin/main',
      repo: 'https://github.com/your-org/DonnaAI-1.0.git',
      path: '/opt/donnaai',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    }
  }
};
```

## 🌐 Nginx 反向代理配置

### 1. 主配置檔案

```nginx
# /etc/nginx/sites-available/donnaai-dashboard
upstream dashboard_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3000;
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream websocket_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3001;
    server 127.0.0.1:3001;
    ip_hash;  # WebSocket 需要會話保持
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=websocket:10m rate=5r/s;

# 主應用 (HTTPS)
server {
    listen 443 ssl http2;
    server_name dashboard.yourdomain.com;
    
    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/dashboard.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全標頭
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' wss://ws.yourdomain.com; frame-ancestors 'self';" always;
    
    # Gzip 壓縮
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # 主應用代理
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://dashboard_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超時設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API 路由
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://dashboard_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # API 特殊設定
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # 靜態資源快取
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://dashboard_backend;
    }
    
    # 健康檢查
    location /health {
        proxy_pass http://dashboard_backend/health;
        access_log off;
    }
    
    # 監控指標 (僅內部)
    location /metrics {
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://dashboard_backend/metrics;
        access_log off;
    }
}

# WebSocket 服務 (HTTPS)
server {
    listen 443 ssl http2;
    server_name ws.yourdomain.com;
    
    # SSL 配置 (同上)
    ssl_certificate /etc/letsencrypt/live/ws.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ws.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # WebSocket 代理
    location / {
        limit_req zone=websocket burst=10 nodelay;
        
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 特殊設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 3600s;  # 1 小時
        proxy_cache_bypass 1;
        proxy_no_cache 1;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name dashboard.yourdomain.com ws.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. 啟用配置

```bash
# 測試配置
sudo nginx -t

# 啟用網站
sudo ln -s /etc/nginx/sites-available/donnaai-dashboard /etc/nginx/sites-enabled/

# 重載 Nginx
sudo systemctl reload nginx
```

## 🔒 SSL 憑證設定

```bash
#!/bin/bash
# setup-ssl.sh

DOMAINS="dashboard.yourdomain.com ws.yourdomain.com"

echo "🔒 設定 SSL 憑證..."

# 安裝 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 取得憑證
for domain in $DOMAINS; do
    echo "為 $domain 取得 SSL 憑證..."
    sudo certbot --nginx -d $domain --non-interactive --agree-tos --email admin@yourdomain.com
done

# 設定自動更新
echo "0 2 * * * root certbot renew --quiet && systemctl reload nginx" | sudo tee -a /etc/crontab

echo "✅ SSL 憑證設定完成！"
```

## 📊 監控系統設定

### 1. 健康檢查腳本

```bash
#!/bin/bash
# health-check.sh

LOG_FILE="/var/log/donnaai-health.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

check_service() {
    local service_name=$1
    local check_command=$2
    
    if eval $check_command > /dev/null 2>&1; then
        log "✅ $service_name is healthy"
        return 0
    else
        log "❌ $service_name is unhealthy"
        return 1
    fi
}

# 檢查項目
log "🔍 開始健康檢查..."

# Next.js 應用
check_service "Dashboard App" "curl -f http://localhost:3000/health"

# WebSocket 服務
check_service "WebSocket Server" "curl -f http://localhost:3001/health"

# Redis
check_service "Redis" "redis-cli ping"

# Nginx
check_service "Nginx" "nginx -t"

# PM2 服務
check_service "PM2 Dashboard" "pm2 describe donnaai-dashboard"
check_service "PM2 WebSocket" "pm2 describe donnaai-websocket"

# 系統資源
MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

log "💾 Memory usage: ${MEM_USAGE}%"
log "💿 Disk usage: ${DISK_USAGE}%"

if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    log "⚠️ High memory usage detected"
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    log "⚠️ High disk usage detected"
fi

log "✅ 健康檢查完成"
```

### 2. 系統監控腳本

```bash
#!/bin/bash
# monitor-system.sh

ALERT_EMAIL="admin@yourdomain.com"
WEBHOOK_URL="https://hooks.slack.com/your-webhook-url"

send_alert() {
    local message=$1
    local severity=${2:-"warning"}
    
    # 發送郵件警報
    echo "$message" | mail -s "DonnaAI Alert [$severity]" $ALERT_EMAIL
    
    # 發送 Slack 通知
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 DonnaAI Alert [$severity]: $message\"}" \
        $WEBHOOK_URL
}

# 監控 PM2 服務
check_pm2_services() {
    local services=("donnaai-dashboard" "donnaai-websocket")
    
    for service in "${services[@]}"; do
        local status=$(pm2 describe $service | grep "status" | awk '{print $4}')
        if [ "$status" != "online" ]; then
            send_alert "Service $service is $status" "critical"
            pm2 restart $service
        fi
    done
}

# 監控記憶體使用
check_memory() {
    local mem_usage=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
    if (( $(echo "$mem_usage > 90" | bc -l) )); then
        send_alert "High memory usage: ${mem_usage}%" "critical"
    elif (( $(echo "$mem_usage > 80" | bc -l) )); then
        send_alert "Memory usage warning: ${mem_usage}%" "warning"
    fi
}

# 監控磁碟使用
check_disk() {
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        send_alert "High disk usage: ${disk_usage}%" "critical"
    elif [ "$disk_usage" -gt 80 ]; then
        send_alert "Disk usage warning: ${disk_usage}%" "warning"
    fi
}

# 執行監控
check_pm2_services
check_memory
check_disk
```

### 3. Crontab 設定

```bash
# 設定定時監控
crontab -e

# 每分鐘檢查服務狀態
* * * * * /opt/donnaai/scripts/health-check.sh

# 每 5 分鐘執行系統監控
*/5 * * * * /opt/donnaai/scripts/monitor-system.sh

# 每天淩晨 2 點清理日誌
0 2 * * * find /opt/donnaai/logs -name "*.log" -mtime +7 -delete

# 每週日淩晨 3 點備份
0 3 * * 0 /opt/donnaai/scripts/backup.sh
```

## 🔄 自動部署設定

### 1. GitHub Actions 工作流程

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Run linting
        run: npm run lint
      
      - name: Build application
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/donnaai
            git pull origin main
            npm ci
            npm run build
            pm2 reload ecosystem.config.js --env production
            
      - name: Health check
        run: |
          sleep 30
          curl -f https://dashboard.yourdomain.com/health
          curl -f https://ws.yourdomain.com/health
      
      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'DonnaAI Dashboard deployment completed'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. 藍綠部署腳本

```bash
#!/bin/bash
# blue-green-deploy.sh

set -e

CURRENT_ENV=$(pm2 describe donnaai-dashboard | grep "exec_mode" | awk '{print $4}')
NEW_ENV="production"
HEALTH_CHECK_URL="http://localhost:3000/health"

echo "🚀 開始藍綠部署..."

# 檢查當前服務狀態
if ! curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
    echo "❌ 當前服務不健康，中止部署"
    exit 1
fi

# 建構新版本
echo "🏗️ 建構新版本..."
npm run build

# 啟動新服務實例
echo "🔄 啟動新服務實例..."
pm2 start ecosystem.config.js --env $NEW_ENV --name "donnaai-dashboard-new"

# 等待新服務就緒
echo "⏳ 等待新服務就緒..."
for i in {1..30}; do
    if curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
        echo "✅ 新服務就緒"
        break
    fi
    sleep 2
done

# 檢查新服務健康狀態
if ! curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
    echo "❌ 新服務不健康，回滾部署"
    pm2 delete donnaai-dashboard-new
    exit 1
fi

# 切換流量
echo "🔀 切換流量到新服務..."
pm2 stop donnaai-dashboard
pm2 start donnaai-dashboard-new
pm2 delete donnaai-dashboard
pm2 restart donnaai-dashboard-new --name donnaai-dashboard

# 清理
pm2 delete donnaai-dashboard-new

echo "✅ 藍綠部署完成！"
```

## 📋 部署檢查清單

### 🔧 部署前檢查
- [ ] 伺服器資源充足 (CPU, Memory, Disk)
- [ ] 所有依賴服務已安裝並運行
- [ ] 環境變數正確配置
- [ ] SSL 憑證已安裝並有效
- [ ] 防火牆規則已配置
- [ ] 備份系統已設定

### 🚀 部署執行
- [ ] 代碼成功部署到伺服器
- [ ] 依賴套件安裝完成
- [ ] 應用程式成功建構
- [ ] PM2 服務正常啟動
- [ ] Nginx 配置正確載入

### ✅ 部署後驗證
- [ ] 主應用程式可正常存取
- [ ] WebSocket 連線功能正常
- [ ] API 端點回應正常
- [ ] 即時資料更新功能正常
- [ ] 使用者登入/登出功能正常
- [ ] Dashboard 各項功能正常運作

### 📊 監控設定
- [ ] 健康檢查腳本運行正常
- [ ] 監控警報設定完成
- [ ] 日誌記錄正常
- [ ] 效能指標收集正常
- [ ] 錯誤追蹤系統正常

### 🔒 安全檢查
- [ ] HTTPS 強制重定向設定
- [ ] 安全標頭配置正確
- [ ] 速率限制設定生效
- [ ] 敏感端點存取控制正常
- [ ] 防火牆規則驗證

## 🛠️ 故障排除

### 常見問題和解決方案

#### 1. 應用程式無法啟動
```bash
# 檢查 PM2 狀態
pm2 status
pm2 logs donnaai-dashboard

# 檢查端口是否被佔用
netstat -tlnp | grep 3000

# 檢查環境變數
printenv | grep NODE_ENV
```

#### 2. WebSocket 連線失敗
```bash
# 檢查 WebSocket 服務
pm2 logs donnaai-websocket
curl -f http://localhost:3001/health

# 檢查防火牆
sudo ufw status
```

#### 3. 資料庫連線問題
```bash
# 檢查 Firebase 憑證
firebase auth:list --project your-project-id

# 檢查 Redis 連線
redis-cli ping
```

#### 4. 記憶體不足
```bash
# 檢查記憶體使用
free -h
pm2 monit

# 重啟服務釋放記憶體
pm2 restart all
```

## 📞 技術支援

### 緊急聯絡資訊
- **技術負責人**: tech-lead@donnaai.com
- **DevOps 團隊**: devops@donnaai.com
- **緊急電話**: +886-xxx-xxx-xxx

### 文件資源
- **API 文件**: https://docs.donnaai.com/api
- **用戶手冊**: https://docs.donnaai.com/user-guide
- **開發指南**: https://docs.donnaai.com/development

---

**注意**: 此部署指南適用於 Ubuntu 20.04 LTS 環境。其他作業系統或環境可能需要調整相應的指令和配置。