// 航班路由控制器
const FlightData = require('../models/flightData');
const FlightService = require('../services/flightService');
const { searchFromTiny } = require('../tingwebdb_server.js');

class FlightController {
    constructor(io) {
        this.io = io;
        this.flightData = new FlightData();
        this.flightService = new FlightService(this.flightData);
        this.connectedUsers = new Map();
    }

    // 处理WebSocket连接
    handleConnection(socket) {
        console.log('用户连接:', socket.id);

        // 信息大屏连接
        socket.on('info_screen_connect', () => {
            console.log('信息大屏连接:', socket.id);
            socket.emit('flights_data', this.flightService.getAllFlights().map(f => f.toJSON()));
        });

        // 用户登录
        socket.on('user_login', (userData) => {
            const { controlType, userName } = userData;
            
            // 添加用户到连接列表
            this.connectedUsers.set(socket.id, {
                id: socket.id,
                controlType,
                userName,
                loginTime: new Date().toISOString()
            });
            
            console.log(`用户登录: ${userName} (${controlType})`);
            
            // 发送当前航班数据给新用户
            socket.emit('flights_data', this.flightService.getAllFlights().map(f => f.toJSON()));
            
            // 广播用户连接状态
            this.io.emit('users_update', Array.from(this.connectedUsers.values()));
            
            // 向信息大屏发送用户连接事件
            socket.broadcast.emit('user_connected', {
                userName,
                controlType,
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });
        });

        // 断开连接处理
        socket.on('disconnect', () => {
            const user = this.connectedUsers.get(socket.id);
            if (user) {
                console.log(`用户断开: ${user.userName} (${user.controlType})`);
                this.connectedUsers.delete(socket.id);
                
                // 广播用户断开状态
                this.io.emit('users_update', Array.from(this.connectedUsers.values()));
                
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
            socket.emit('flights_data', this.flightService.getAllFlights().map(f => f.toJSON()));
        });

        // 航班移交
        socket.on('flight_transfer', async (data) => {
            console.log('航班移交:', data);
            
            const flight = await this.flightService.transferFlight(
                data.flightId,
                data.fromControl,
                data.toControl,
                data.newStatus,
                data.newPosition
            );
            
            if (flight) {
                // 广播给所有客户端
                this.io.emit('flight_updated', flight.toJSON());
                console.log(`航班 ${flight.callsign} 从 ${data.fromControl} 移交至 ${data.toControl}`);
                
                // 向信息大屏发送航班移交事件
                socket.broadcast.emit('flight_transfer', {
                    flight: flight.toJSON(),
                    fromControl: data.fromControl,
                    toControl: data.toControl,
                    timestamp: new Date().toISOString()
                });
                
                // 发送移交提示给目标管制单位
                this.io.emit('flight_transfer_notification', {
                    flight: flight.toJSON(),
                    fromControl: data.fromControl,
                    toControl: data.toControl,
                    message: `航班 ${flight.callsign} 已从 ${data.fromControl} 移交至 ${data.toControl}`,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // 添加新航班
        socket.on('flight_add', async (flightData) => {
            console.log('添加新航班:', flightData);
            
            const newFlight = await this.flightService.addFlight(flightData);
            
            if (newFlight) {
                // 广播新航班给所有客户端
                this.io.emit('flight_added', newFlight.toJSON());
                console.log(`新航班 ${newFlight.callsign} 已添加`);
            }
        });

        // 删除航班
        socket.on('flight_delete', async (data) => {
            console.log('删除航班:', data);
            
            const deletedFlight = await this.flightService.deleteFlight(data.flightId);
            
            if (deletedFlight) {
                // 广播删除事件给所有客户端
                this.io.emit('flight_deleted', { 
                    flightId: data.flightId, 
                    callsign: deletedFlight.callsign 
                });
                console.log(`航班 ${deletedFlight.callsign} 已删除`);
            }
        });
    }

    // API路由 - 获取航班数据
    getFlights(req, res) {
        const flights = this.flightService.getAllFlights().map(f => f.toJSON());
        res.json(flights);
    }

    // API路由 - 健康检查
    healthCheck(req, res) {
        res.json({ 
            status: 'ok', 
            connectedUsers: this.connectedUsers.size,
            timestamp: new Date().toISOString()
        });
    }

    // API路由 - 测试TinyWebDB同步
    async syncToTiny(req, res) {
        try {
            const flights = this.flightService.getAllFlights();
            let successCount = 0;
            let errorCount = 0;
            
            for (const flight of flights) {
                try {
                    const success = await this.flightService.syncFlightToTinyWebDB(flight);
                    if (success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
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
    }

    // API路由 - 从TinyWebDB查询航班
    async queryTiny(req, res) {
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
    }

    // API路由 - 信息大屏获取数据（从TinyWebDB和本地文件双重验证）
    async getInfoScreenData(req, res) {
        try {
            // 获取本地文件数据
            const localFlights = this.flightService.getAllFlights().map(f => f.toJSON());
            
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
    }
}

module.exports = FlightController;
