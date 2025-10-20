const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 导入TinyWebDB功能
const { updateToTiny, searchFromTiny, deleteFromTiny } = require('./tingwebdb_server.js');

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

// TinyWebDB同步函数
async function syncFlightToTinyWebDB(flight) {
  try {
    // 使用航班呼号作为tag，航班其他信息作为value
    const flightData = {
      id: flight.id,
      status: flight.status,
      currentControl: flight.currentControl,
      nextControl: flight.nextControl,
      position: flight.position,
      altitude: flight.altitude,
      heading: flight.heading,
      departure: flight.departure,
      destination: flight.destination,
      remarks: flight.remarks,
      lastUpdated: new Date().toISOString()
    };
    
    await updateToTiny(flight.callsign, flightData);
    console.log(`✈️ 航班 ${flight.callsign} 已同步到TinyWebDB`);
  } catch (error) {
    console.error(`❌ 航班 ${flight.callsign} 同步到TinyWebDB失败:`, error.message);
  }
}

// 从TinyWebDB删除航班数据
async function deleteFlightFromTinyWebDB(callsign) {
  try {
    // 通过更新为空值来"删除"数据
    await updateToTiny(callsign, null);
    console.log(`🗑️ 航班 ${callsign} 已从TinyWebDB删除`);
  } catch (error) {
    console.error(`❌ 航班 ${callsign} 从TinyWebDB删除失败:`, error.message);
  }
}

// 更新航班数据
function updateFlight(updatedFlight) {
  const flights = loadFlights();
  const index = flights.findIndex(f => f.id === updatedFlight.id);
  if (index !== -1) {
    flights[index] = { ...flights[index], ...updatedFlight };
    saveFlights(flights);
    
    // 同步到TinyWebDB（使用呼号作为tag）
    const flight = flights[index];
    syncFlightToTinyWebDB(flight);
    
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
  
  // 同步到TinyWebDB
  syncFlightToTinyWebDB(newFlight);
  
  return newFlight;
}

// 初始化数据
let flights = initializeFlights();
let connectedUsers = new Map();

  // Socket.io 连接处理
  io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 信息大屏连接
    socket.on('info_screen_connect', () => {
      console.log('信息大屏连接:', socket.id);
      // 发送当前航班数据给信息大屏
      socket.emit('flights_data', getFlights());
    });

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
      
      // 向信息大屏发送用户连接事件
      socket.broadcast.emit('user_connected', {
        userName: userData.userName,
        controlType: userData.controlType,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // 断开连接处理
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        console.log(`用户断开: ${user.userName} (${user.controlType})`);
        connectedUsers.delete(socket.id);
        
        // 广播用户断开状态
        io.emit('users_update', Array.from(connectedUsers.values()));
        
        // 向信息大屏发送用户断开事件
        socket.broadcast.emit('user_disconnected', {
          userName: user.userName,
          controlType: user.controlType,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      }
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
      
      // 向信息大屏发送航班移交事件
      socket.broadcast.emit('flight_transfer', {
        flight: flight,
        fromControl: data.fromControl,
        toControl: data.toControl,
        timestamp: new Date().toISOString()
      });
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

  // 删除航班
  socket.on('flight_delete', (data) => {
    console.log('删除航班:', data);
    
    const flights = loadFlights();
    const index = flights.findIndex(f => f.id === data.flightId);
    
    if (index !== -1) {
      const deletedFlight = flights[index];
      flights.splice(index, 1);
      saveFlights(flights);
      
      // 从TinyWebDB删除
      deleteFromTiny(deletedFlight.callsign);
      
      // 广播删除事件给所有客户端
      io.emit('flight_deleted', { flightId: data.flightId, callsign: deletedFlight.callsign });
      console.log(`航班 ${deletedFlight.callsign} 已删除`);
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

// API路由 - 测试TinyWebDB同步
app.get('/api/sync-to-tiny', async (req, res) => {
  try {
    const flights = getFlights();
    let successCount = 0;
    let errorCount = 0;
    
    for (const flight of flights) {
      try {
        await syncFlightToTinyWebDB(flight);
        successCount++;
      } catch (error) {
        console.error(`同步航班 ${flight.callsign} 失败:`, error);
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      message: `同步完成: ${successCount} 成功, ${errorCount} 失败`,
      successCount,
      errorCount,
      totalFlights: flights.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '同步失败',
      error: error.message
    });
  }
});

// API路由 - 从TinyWebDB查询航班
app.get('/api/query-tiny', async (req, res) => {
  try {
    const result = await searchFromTiny({ count: 50, type: 'both' });
    res.json({
      success: true,
      data: result.data,
      message: '查询成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '查询失败',
      error: error.message
    });
  }
});

// API路由 - 信息大屏获取数据（从TinyWebDB和本地文件双重验证）
app.get('/api/info-screen-data', async (req, res) => {
  try {
    // 获取本地文件数据
    const localFlights = getFlights();
    
    // 从TinyWebDB获取数据
    const tinyResult = await searchFromTiny({ count: 50, type: 'both' });
    
    // 解析TinyWebDB数据
    const tinyFlights = [];
    if (tinyResult.success && tinyResult.data) {
      // 遍历TinyWebDB数据，提取航班信息
      for (const [tag, value] of Object.entries(tinyResult.data)) {
        // 跳过非航班数据（如示例数据）
        if (tag === 'username') continue;
        
        try {
          const flightData = JSON.parse(value);
          // 添加呼号到数据中
          flightData.callsign = tag;
          tinyFlights.push(flightData);
        } catch (parseError) {
          console.warn(`解析TinyWebDB数据失败 (${tag}):`, parseError);
        }
      }
    }
    
    // 数据核对和合并
    const mergedData = {
      localFlights: localFlights,
      tinyFlights: tinyFlights,
      comparison: {
        localCount: localFlights.length,
        tinyCount: tinyFlights.length,
        match: localFlights.length === tinyFlights.length
      }
    };
    
    res.json({
      success: true,
      data: mergedData,
      message: '数据获取和核对完成'
    });
  } catch (error) {
    console.error('信息大屏数据获取失败:', error);
    res.status(500).json({
      success: false,
      message: '数据获取失败',
      error: error.message
    });
  }
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
