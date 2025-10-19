// WebSocket客户端管理
console.log('socket-client.js 加载');

const socketClient = {
    socket: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,

    // 初始化Socket连接
    init() {
        try {
            console.log('开始初始化WebSocket连接...');
            
            // 检查io是否已定义
            if (typeof io === 'undefined') {
                console.error('Socket.io库未加载');
                this.handleConnectionError();
                return;
            }
            
            // 连接到服务器
            this.socket = io({
                timeout: 5000,
                reconnectionAttempts: 5
            });
            
            this.setupEventListeners();
            console.log('WebSocket连接初始化完成');
        } catch (error) {
            console.error('WebSocket连接失败:', error);
            this.handleConnectionError();
        }
    },

    // 设置事件监听器
    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('✅ 已连接到服务器');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
            
            // 连接后立即请求最新数据
            this.socket.emit('get_flights');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ 与服务器断开连接');
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('flights_data', (flights) => {
            console.log('📡 收到航班数据:', flights.length, '个航班');
            this.handleFlightsData(flights);
        });

        this.socket.on('flight_updated', (flight) => {
            console.log('🔄 航班更新:', flight.callsign);
            this.handleFlightUpdate(flight);
        });

        this.socket.on('flight_added', (flight) => {
            console.log('✈️ 新航班添加:', flight.callsign);
            this.handleFlightAdded(flight);
        });

        this.socket.on('users_update', (users) => {
            console.log('👥 在线用户更新:', users.length, '个用户');
            this.handleUsersUpdate(users);
        });

        this.socket.on('connect_error', (error) => {
            console.error('🔌 连接错误:', error);
            this.handleConnectionError();
        });
    },

    // 用户登录
    login(userData) {
        if (this.socket && this.isConnected) {
            this.socket.emit('user_login', userData);
            console.log('👤 用户登录:', userData.userName);
        }
    },

    // 移交航班
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
            console.log('🔄 发送移交请求:', flightId, '从', fromControl, '到', toControl);
            return true;
        }
        console.warn('❌ WebSocket未连接，无法移交航班');
        return false;
    },

    // 添加航班
    addFlight(flightData) {
        if (this.socket && this.isConnected) {
            this.socket.emit('flight_add', flightData);
            console.log('✈️ 发送添加航班请求:', flightData.callsign);
            return true;
        }
        console.warn('❌ WebSocket未连接，无法添加航班');
        return false;
    },

    // 处理航班数据
    handleFlightsData(flights) {
        // 更新全局航班数据
        if (typeof flightData !== 'undefined') {
            flightData.flights = flights;
            console.log('📊 更新本地航班数据:', flights.length, '个航班');
        }
        
        // 刷新界面
        if (typeof common !== 'undefined' && auth.getCurrentUser()) {
            common.renderManagedFlights(auth.getCurrentUser().type);
            common.renderAllFlightsTable();
        }
    },

    // 处理航班更新
    handleFlightUpdate(flight) {
        // 更新本地航班数据
        if (typeof flightData !== 'undefined') {
            const index = flightData.flights.findIndex(f => f.id === flight.id);
            if (index !== -1) {
                flightData.flights[index] = flight;
                console.log('🔄 更新本地航班:', flight.callsign);
            }
        }
        
        // 刷新界面
        if (typeof common !== 'undefined' && auth.getCurrentUser()) {
            common.renderManagedFlights(auth.getCurrentUser().type);
            common.renderAllFlightsTable();
        }
    },

    // 处理新航班
    handleFlightAdded(flight) {
        // 添加到本地航班数据
        if (typeof flightData !== 'undefined') {
            flightData.flights.push(flight);
            console.log('✈️ 添加新航班到本地:', flight.callsign);
        }
        
        // 刷新界面
        if (typeof common !== 'undefined' && auth.getCurrentUser()) {
            common.renderManagedFlights(auth.getCurrentUser().type);
            common.renderAllFlightsTable();
        }
    },

    // 处理用户更新
    handleUsersUpdate(users) {
        // 可以在这里显示在线用户信息
        console.log('👥 当前在线用户:', users.map(u => u.userName));
        
        // 更新在线用户显示
        this.updateOnlineUsers(users);
    },

    // 更新连接状态显示
    updateConnectionStatus(connected) {
        let statusElement = document.getElementById('connectionStatus');
        if (!statusElement) {
            // 创建状态元素
            const headerInfo = document.querySelector('.header-info');
            if (headerInfo) {
                statusElement = document.createElement('div');
                statusElement.id = 'connectionStatus';
                statusElement.className = 'connection-status';
                headerInfo.appendChild(statusElement);
            }
        }
        
        if (statusElement) {
            if (connected) {
                statusElement.textContent = '🟢 已连接';
                statusElement.style.color = '#2ecc71';
            } else {
                statusElement.textContent = '🔴 断开';
                statusElement.style.color = '#e74c3c';
            }
        }
    },

    // 更新在线用户显示
    updateOnlineUsers(users) {
        let usersElement = document.getElementById('onlineUsers');
        if (!usersElement) {
            const headerInfo = document.querySelector('.header-info');
            if (headerInfo) {
                usersElement = document.createElement('div');
                usersElement.id = 'onlineUsers';
                usersElement.className = 'online-users';
                usersElement.style.fontSize = '12px';
                usersElement.style.color = '#95a5a6';
                headerInfo.appendChild(usersElement);
            }
        }
        
        if (usersElement) {
            if (users.length > 0) {
                const userNames = users.map(u => u.userName).join(', ');
                usersElement.textContent = `👥 在线: ${userNames}`;
            } else {
                usersElement.textContent = '👥 无其他用户在线';
            }
        }
    },

    // 处理连接错误
    handleConnectionError() {
        this.reconnectAttempts++;
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            console.log(`🔄 尝试重新连接... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.init(), 3000);
        } else {
            console.error('❌ 达到最大重连次数，请检查服务器状态');
            this.updateConnectionStatus(false);
        }
    }
};

console.log('socket-client.js 初始化完成');