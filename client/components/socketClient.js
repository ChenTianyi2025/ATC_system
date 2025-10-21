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
            }
            if (typeof common !== 'undefined' && typeof auth !== 'undefined') {
                const user = auth.getCurrentUser();
                if (user) {
                    common.renderManagedFlights(user.type);
                    common.renderAllFlightsTable();
                }
            }
        });

        this.socket.on('flight_updated', (flight) => {
            console.log('🔄 航班更新:', flight.callsign);
            if (typeof flightData !== 'undefined') {
                const index = flightData.flights.findIndex(f => f.id === flight.id);
                if (index !== -1) {
                    flightData.flights[index] = flight;
                }
            }
            if (typeof common !== 'undefined' && typeof auth !== 'undefined') {
                const user = auth.getCurrentUser();
                if (user) {
                    common.renderManagedFlights(user.type);
                    common.renderAllFlightsTable();
                }
            }
        });

        this.socket.on('flight_added', (flight) => {
            console.log('✈️ 新航班添加:', flight.callsign);
            if (typeof flightData !== 'undefined') {
                flightData.flights.push(flight);
            }
            if (typeof common !== 'undefined' && typeof auth !== 'undefined') {
                const user = auth.getCurrentUser();
                if (user) {
                    common.renderManagedFlights(user.type);
                    common.renderAllFlightsTable();
                }
            }
        });

        this.socket.on('flight_deleted', (data) => {
            console.log('🗑️ 航班删除:', data.callsign);
            if (typeof flightData !== 'undefined') {
                const index = flightData.flights.findIndex(f => f.id === data.flightId);
                if (index !== -1) {
                    flightData.flights.splice(index, 1);
                }
            }
            if (typeof common !== 'undefined' && typeof auth !== 'undefined') {
                const user = auth.getCurrentUser();
                if (user) {
                    common.renderManagedFlights(user.type);
                    common.renderAllFlightsTable();
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
            this.socket.emit('user_login', userData);
        }
    },

    transferFlight(flightId, fromControl, toControl, newStatus, newPosition) {
        if (this.socket && this.isConnected) {
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
        return false;
    },

    addFlight(flightData) {
        if (this.socket && this.isConnected) {
            this.socket.emit('flight_add', flightData);
            return true;
        }
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
