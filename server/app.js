// ATC系统主服务器应用
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入路由和控制器
const { router, setController } = require('./routes/api');
const FlightController = require('./controllers/flightController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 重要：修复静态文件服务配置
const clientPath = path.join(__dirname, '../client');
console.log('客户端文件路径:', clientPath);

// 提供静态文件服务
app.use(express.static(clientPath));

// 特别为JS文件设置路由
app.use('/js/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(clientPath, 'js', filename);
  console.log('📁 请求JS文件:', filename, '路径:', filePath);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    console.error('❌ JS文件未找到:', filePath);
    res.status(404).send('File not found');
  }
});

// 特别为CSS文件设置路由
app.use('/css/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(clientPath, 'css', filename);
  console.log('请求CSS文件:', filename, '路径:', filePath);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// 特别为页面文件设置路由
app.use('/pages/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(clientPath, 'pages', filename);
  console.log('请求页面文件:', filename, '路径:', filePath);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// 使用API路由
app.use('/api', router);

// 创建航班控制器
const flightController = new FlightController(io);
setController(flightController);

// Socket.io 连接处理
io.on('connection', (socket) => {
    flightController.handleConnection(socket);
});

// API路由 - 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

// 默认路由 - 服务客户端文件
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`🚀 ATC实时系统服务器运行在 http://localhost:${PORT}`);
  console.log(`📡 WebSocket服务已启动`);
  console.log(`✈️  初始航班数据已加载: ${flightController.flightService.getAllFlights().length} 个航班`);
});

module.exports = { app, server, io };
