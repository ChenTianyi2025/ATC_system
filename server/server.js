const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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

// 其余服务器代码保持不变...

// 航班数据文件路径
const FLIGHTS_FILE = path.join(__dirname, 'flights.json');

// 初始化航班数据
function initializeFlights() {
  if (!fs.existsSync(FLIGHTS_FILE)) {
    const initialFlights = [
      {
        id: "1",
        callsign: "CPA123",
        status: "scheduled",
        currentControl: "DEL",
        nextControl: "GND",
        position: "Gate A1",
        altitude: 0,
        heading: 0,
        departure: "VHHH",
        destination: "ZBAA",
        remarks: ""
      },
      {
        id: "2",
        callsign: "CES456",
        status: "boarding",
        currentControl: "DEL",
        nextControl: "GND",
        position: "Gate B2",
        altitude: 0,
        heading: 0,
        departure: "VHHH",
        destination: "RJTT",
        remarks: ""
      },
      {
        id: "3",
        callsign: "UAL789",
        status: "taxiing",
        currentControl: "GND",
        nextControl: "TWR",
        position: "Taxiway A",
        altitude: 0,
        heading: 120,
        departure: "VHHH",
        destination: "KSFO",
        remarks: ""
      },
      {
        id: "4",
        callsign: "SIA890",
        status: "ready",
        currentControl: "TWR",
        nextControl: "APP",
        position: "Runway 07R",
        altitude: 0,
        heading: 70,
        departure: "VHHH",
        destination: "WSSS",
        remarks: ""
      },
      {
        id: "5",
        callsign: "AFR234",
        status: "departed",
        currentControl: "APP",
        nextControl: "CEN",
        position: "10NM NE",
        altitude: 5000,
        heading: 45,
        departure: "VHHH",
        destination: "LFPG",
        remarks: ""
      },
      {
        id: "6",
        callsign: "BAW567",
        status: "cruising",
        currentControl: "CEN",
        nextControl: "CEN",
        position: "150NM SW",
        altitude: 35000,
        heading: 320,
        departure: "VHHH",
        destination: "EGLL",
        remarks: ""
      }
    ];
    saveFlights(initialFlights);
    return initialFlights;
  }
  return loadFlights();
}

// 保存航班数据到文件
function saveFlights(flights) {
  try {
    fs.writeFileSync(FLIGHTS_FILE, JSON.stringify(flights, null, 2));
    console.log('航班数据已保存');
  } catch (error) {
    console.error('保存航班数据失败:', error);
  }
}

// 从文件加载航班数据
function loadFlights() {
  try {
    const data = fs.readFileSync(FLIGHTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('加载航班数据失败:', error);
    return [];
  }
}

// 获取航班数据
function getFlights() {
  return loadFlights();
}

// 更新航班数据
function updateFlight(updatedFlight) {
  const flights = loadFlights();
  const index = flights.findIndex(f => f.id === updatedFlight.id);
  if (index !== -1) {
    flights[index] = { ...flights[index], ...updatedFlight };
    saveFlights(flights);
    return flights[index];
  }
  return null;
}

// 添加新航班
function addFlight(flightData) {
  const flights = loadFlights();
  const newFlight = {
    id: Date.now().toString(),
    ...flightData,
    currentControl: "DEL",
    nextControl: "GND",
    altitude: 0,
    heading: 0
  };
  flights.push(newFlight);
  saveFlights(flights);
  return newFlight;
}

// 初始化数据
let flights = initializeFlights();
let connectedUsers = new Map();

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 用户登录
  socket.on('user_login', (userData) => {
    connectedUsers.set(socket.id, {
      id: socket.id,
      controlType: userData.controlType,
      userName: userData.userName,
      loginTime: new Date().toISOString()
    });
    
    console.log(`用户登录: ${userData.userName} (${userData.controlType})`);
    
    // 发送当前航班数据给新用户
    socket.emit('flights_data', getFlights());
    
    // 广播用户连接状态
    io.emit('users_update', Array.from(connectedUsers.values()));
  });

  // 请求航班数据
  socket.on('get_flights', () => {
    socket.emit('flights_data', getFlights());
  });

  // 航班移交
  socket.on('flight_transfer', (data) => {
    console.log('航班移交:', data);
    
    const flight = updateFlight({
      id: data.flightId,
      currentControl: data.toControl,
      status: data.newStatus || 'taxiing',
      position: data.newPosition || '移交中'
    });
    
    if (flight) {
      // 广播给所有客户端
      io.emit('flight_updated', flight);
      console.log(`航班 ${flight.callsign} 从 ${data.fromControl} 移交至 ${data.toControl}`);
    }
  });

  // 添加新航班
  socket.on('flight_add', (flightData) => {
    console.log('添加新航班:', flightData);
    
    const newFlight = addFlight(flightData);
    
    // 广播新航班给所有客户端
    io.emit('flight_added', newFlight);
    console.log(`新航班 ${newFlight.callsign} 已添加`);
  });

  // 断开连接处理
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`用户断开: ${user.userName} (${user.controlType})`);
      connectedUsers.delete(socket.id);
      
      // 广播用户断开状态
      io.emit('users_update', Array.from(connectedUsers.values()));
    }
  });
});

// API路由 - 获取航班数据
app.get('/api/flights', (req, res) => {
  res.json(getFlights());
});

// API路由 - 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connectedUsers: connectedUsers.size,
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
  console.log(`✈️  初始航班数据已加载: ${getFlights().length} 个航班`);
});
