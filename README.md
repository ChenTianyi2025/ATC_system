# 🛫 ATC System - 模拟空中交通管制系统

一个基于WebSocket的实时空中交通管制系统，支持多管制单位协同工作和航班状态实时管理。

## 🌟 系统特性

- **实时通信**：基于WebSocket的实时数据传输
- **多管制单位**：DEL、GND、TWR、APP、CEN、CON六种管制角色
- **航班管理**：完整的航班生命周期管理
- **数据同步**：与TinyWebDB云端数据库实时同步
- **信息大屏**：实时航班状态展示
- **模块化架构**：清晰的前后端分离设计

## 📁 项目结构

```
ATC_system/
├── client/                 # 客户端代码
│   ├── components/        # 模块化组件
│   │   ├── auth.js        # 认证模块
│   │   ├── flightData.js  # 数据管理模块
│   │   ├── socketClient.js # WebSocket客户端
│   │   └── common.js      # 通用功能模块
│   ├── css/               # 样式文件
│   ├── js/                # JavaScript文件
│   │   └── app.js         # 主应用入口
│   ├── pages/             # 页面文件
│   └── index.html         # 登录页面
├── server/                # 服务端代码
│   ├── controllers/       # 控制器层
│   ├── models/           # 数据模型层
│   ├── routes/           # 路由定义
│   ├── services/         # 服务层
│   ├── app.js           # 主应用文件
│   ├── package.json     # 依赖配置
│   └── tingwebdb_server.js # TinyWebDB集成
├── .env                 # 环境配置文件
├── .env.example         # 环境配置示例
└── README.md            # 项目说明文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/ChenTianyi2025/ATC_system.git
cd ATC_system
```

2. **安装服务端依赖**
```bash
cd server
npm install
```

3. **配置环境变量**
```bash
# 复制示例配置文件
cp .env.example .env

# 编辑配置文件
nano .env  # 或使用其他编辑器
```

4. **启动服务**
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

5. **访问应用**
打开浏览器访问 `http://localhost:3000`

## ⚙️ 环境配置

### .env 配置文件

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# TinyWebDB配置
TINYWEBDB_URL=https://xmake.io/~tinywebdb/cgi-bin/tinywebdb.py
TINYWEBDB_USERNAME=your_username
TINYWEBDB_PASSWORD=your_password

# 数据库配置（预留）
DB_HOST=localhost
DB_PORT=27017
DB_NAME=atc_system

# 安全配置
SESSION_SECRET=your_session_secret_key
JWT_SECRET=your_jwt_secret

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/atc_system.log

# 备份配置
BACKUP_INTERVAL=3600000
BACKUP_PATH=./backups/
```

### 配置说明

- `PORT`：服务器监听端口
- `NODE_ENV`：运行环境（development/production）
- `TINYWEBDB_URL`：TinyWebDB服务地址
- `TINYWEBDB_USERNAME/PASSWORD`：TinyWebDB认证信息
- `SESSION_SECRET/JWT_SECRET`：安全密钥
- `LOG_LEVEL`：日志级别（debug/info/warn/error）
- `BACKUP_INTERVAL`：备份间隔（毫秒）

## 🎮 使用指南

### 管制单位说明

| 管制代码 | 管制名称 | 密码 | 职责 |
|---------|---------|------|------|
| DEL | 签派管制 | del123 | 航班签派和初始管理 |
| GND | 地面管制 | gnd123 | 机场地面滑行管理 |
| TWR | 塔台管制 | twr123 | 跑道起降管理 |
| APP | 进近管制 | app123 | 进离场航班管理 |
| CEN | 区域管制 | cen123 | 航路飞行管理 |
| CON | 航班管理 | con123 | 系统管理和航班维护 |

### 操作流程

1. **登录系统**：选择管制类型并输入对应密码
2. **航班管理**：
   - DEL：添加新航班，移交至GND
   - GND：管理滑行航班，移交至TWR
   - TWR：管理跑道航班，移交至APP
   - APP：管理离场航班，移交至CEN
   - CEN：管理航路航班
   - CON：查看和删除所有航班
3. **信息大屏**：实时查看所有航班状态

### 航班状态流转

```
计划中(scheduled) → 登机中(boarding) → 滑行中(taxiing) 
    ↓
准备起飞(ready) → 已起飞(departed) → 巡航中(cruising)
```

## 🛠️ 开发指南

### 客户端架构

采用ES6模块化设计：

```javascript
// 导入模块
import auth from './components/auth.js';
import flightData from './components/flightData.js';
import socketClient from './components/socketClient.js';
import common from './components/common.js';

// 使用模块
auth.login(controlType, password);
flightData.getFlights();
socketClient.init();
common.renderManagedFlights();
```

### 服务端架构

采用分层架构设计：

```
Controller层 → Service层 → Model层
     ↓           ↓          ↓
  路由处理    业务逻辑    数据访问
```

### API接口

#### WebSocket事件

| 事件名称 | 说明 | 参数 |
|---------|------|------|
| `user_login` | 用户登录 | `{controlType, userName}` |
| `flight_transfer` | 航班移交 | `{flightId, fromControl, toControl, newStatus, newPosition}` |
| `flight_add` | 添加航班 | `flightData` |
| `flight_delete` | 删除航班 | `{flightId}` |

#### RESTful API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/flights` | GET | 获取所有航班数据 |
| `/api/health` | GET | 健康检查 |
| `/api/sync-to-tiny` | GET | 同步数据到TinyWebDB |
| `/api/query-tiny` | GET | 查询TinyWebDB数据 |
| `/api/info-screen-data` | GET | 信息大屏数据 |

## 📦 部署指南

### 本地部署

1. **安装依赖**
```bash
cd server
npm install
```

2. **配置环境**
```bash
# 复制示例配置文件（在项目根目录）
cp .env.example .env

# 编辑 .env 文件配置生产环境参数
nano .env  # 或使用其他编辑器
```

3. **启动服务**
```bash
npm start
```

### Docker部署（推荐）

1. **创建Dockerfile**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .
EXPOSE 3000
CMD ["npm", "start"]
```

2. **构建和运行**
```bash
docker build -t atc-system .
docker run -p 3000:3000 -d atc-system
```

### PM2部署

1. **安装PM2**
```bash
npm install -g pm2
```

2. **启动应用**
```bash
cd server
pm2 start app.js --name "atc-system"
pm2 startup
pm2 save
```

### Nginx反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 维护和监控

### 日志管理

系统会自动记录操作日志：
- 服务端日志：控制台输出和文件记录
- 客户端日志：浏览器控制台
- 操作日志：信息大屏实时显示

### 数据备份

```bash
# 手动备份
cp server/flights.json backups/flights_$(date +%Y%m%d_%H%M%S).json

# 自动备份（通过定时任务）
0 */1 * * * cp server/flights.json backups/flights_$(date +\%Y\%m\%d_\%H\%M\%S).json
```

### 性能监控

```bash
# 查看进程状态
pm2 list
pm2 monit

# 查看日志
pm2 logs atc-system
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

项目链接: [https://github.com/ChenTianyi2025/ATC_system](https://github.com/ChenTianyi2025/ATC_system)

## 🙏 致谢

- 感谢所有为项目做出贡献的开发者
- 感谢TinyWebDB提供的云端数据存储服务
- 感谢开源社区的支持

---
*Made with ❤️ for aviation enthusiasts*
