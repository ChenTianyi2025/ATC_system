// ATC系统WebSocket客户端模块
console.log('📡 加载WebSocket客户端...');

const socketClient = {
    socket: null,
    isConnected: false,

    init() {
        try {
            console.log('🔌 初始化WebSocket连接...');
            this.socket = io();
            this.setupEventListeners();
        } catch (error) {
            console.error('❌ WebSocket连接失败:', error);
        }
    },

    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('✅ 已连接到服务器');
            this.isConnected = true;
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ 与服务器断开连接');
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('flights_data', (flights) => {
            console.log('📡 收到航班数据:', flights.length, '个航班');
            if (typeof flightData !== 'undefined') {
                flightData.flights = flights;
                console.log('✅ 本地航班数据已更新');
            }
            if (typeof common !== 'undefined' && typeof auth !== 'undefined') {
                const user = auth.getCurrentUser();
                if (user) {
                    console.log('🔄 重新渲染航班列表...');
                    common.renderManagedFlights(user.type);
                    common.renderAllFlightsTable();
                    console.log('✅ 航班列表渲染完成');
                }
            }
        });

        this.socket.on('flight_updated', (flight) => {
            console.log('🔄 航班更新:', flight.callsign);
            if (typeof flightData !== 'undefined') {
                const index = flightData.flights.findIndex(f => f.id === flight.id);
                if (index !== -1) {
                    flightData.flights[index] = flight;
                    console.log('✅ 本地航班数据已更新:', flight.callsign);
                } else {
                    console.warn('⚠️ 未找到要更新的航班:', flight.id);
                }
            }
            if (typeof common !== 'undefined' && typeof auth !== 'undefined') {
                const user = auth.getCurrentUser();
                if (user) {
                    console.log('🔄 重新渲染航班列表...');
                    common.renderManagedFlights(user.type);
                    common.renderAllFlightsTable();
                    console.log('✅ 航班列表渲染完成');
                }
            }
        });

        this.socket.on('flight_added', (flight) => {
            console.log('✈️ 新航班添加:', flight.callsign);
            if (typeof flightData !== 'undefined') {
                flightData.flights.push(flight);
                console.log('✅ 本地航班数据已添加:', flight.callsign);
            }
            if (typeof common !== 'undefined' && typeof auth !== 'undefined') {
                const user = auth.getCurrentUser();
                if (user) {
                    console.log('🔄 重新渲染航班列表...');
                    common.renderManagedFlights(user.type);
                    common.renderAllFlightsTable();
                    console.log('✅ 航班列表渲染完成');
                }
            }
        });

        this.socket.on('flight_deleted', (data) => {
            console.log('🗑️ 航班删除:', data.callsign);
            if (typeof flightData !== 'undefined') {
                const index = flightData.flights.findIndex(f => f.id === data.flightId);
                if (index !== -1) {
                    flightData.flights.splice(index, 1);
                    console.log('✅ 本地航班数据已删除:', data.callsign);
                } else {
                    console.warn('⚠️ 未找到要删除的航班:', data.flightId);
                }
            }
            if (typeof common !== 'undefined' && typeof auth !== 'undefined') {
                const user = auth.getCurrentUser();
                if (user) {
                    console.log('🔄 重新渲染航班列表...');
                    common.renderManagedFlights(user.type);
                    common.renderAllFlightsTable();
                    console.log('✅ 航班列表渲染完成');
                }
            }
        });

        // 航班移交提示
        this.socket.on('flight_transfer_notification', (data) => {
            console.log('📡 收到航班移交提示:', data);
            if (typeof common !== 'undefined') {
                common.showTransferNotification(data);
            }
        });
    },

    login(userData) {
        if (this.socket && this.isConnected) {
            console.log('👤 发送用户登录信息:', userData);
            this.socket.emit('user_login', userData);
        }
    },

    transferFlight(flightId, fromControl, toControl, newStatus, newPosition) {
        if (this.socket && this.isConnected) {
            console.log('🔄 发送航班移交请求:', { flightId, fromControl, toControl, newStatus, newPosition });
            this.socket.emit('flight_transfer', {
                flightId,
                fromControl,
                toControl,
                newStatus,
                newPosition,
                timestamp: new Date().toISOString()
            });
            return true;
        }
        console.warn('⚠️ WebSocket未连接，无法发送航班移交请求');
        return false;
    },

    addFlight(flightData) {
        if (this.socket && this.isConnected) {
            console.log('✈️ 发送添加航班请求:', flightData);
            this.socket.emit('flight_add', flightData);
            return true;
        }
        console.warn('⚠️ WebSocket未连接，无法发送添加航班请求');
        return false;
    },

    updateConnectionStatus(connected) {
        let statusElement = document.getElementById('connectionStatus');
        if (!statusElement) {
            const headerInfo = document.querySelector('.header-info');
            if (headerInfo) {
                statusElement = document.createElement('div');
                statusElement.id = 'connectionStatus';
                statusElement.className = 'connection-status';
                headerInfo.appendChild(statusElement);
            }
        }
        if (statusElement) {
            statusElement.textContent = connected ? '🟢 已连接' : '🔴 断开';
            statusElement.style.color = connected ? '#2ecc71' : '#e74c3c';
        }
    }
};

console.log('✅ WebSocket客户端加载完成');
export default socketClient;