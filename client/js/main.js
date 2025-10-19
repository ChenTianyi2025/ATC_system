// ATC系统主应用程序 - 所有功能在一个文件中
console.log('🚀 ATC系统开始加载...');

// ==================== 认证模块 ====================
console.log('🔐 加载认证模块...');
const auth = {
    users: {
        "DEL": { password: "del123", name: "签派管制" },
        "GND": { password: "gnd123", name: "地面管制" },
        "TWR": { password: "twr123", name: "塔台管制" },
        "APP": { password: "app123", name: "进近管制" },
        "CEN": { password: "cen123", name: "区域管制" }
    },

    login(controlType, password) {
        const user = this.users[controlType];
        if (user && user.password === password) {
            const userInfo = {
                type: controlType,
                name: user.name,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('atcCurrentUser', JSON.stringify(userInfo));
            return true;
        }
        return false;
    },

    logout() {
        localStorage.removeItem('atcCurrentUser');
        window.location.href = '/';
    },

    getCurrentUser() {
        const user = localStorage.getItem('atcCurrentUser');
        return user ? JSON.parse(user) : null;
    },

    requireAuth() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = '/';
            return null;
        }
        return user;
    }
};
console.log('✅ 认证模块加载完成');

// ==================== 数据模块 ====================
console.log('📊 加载数据模块...');
const flightData = {
    flights: [
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
    ],

    getFlights() {
        return this.flights;
    },

    getFlightsByControl(controlType) {
        return this.flights.filter(flight => flight.currentControl === controlType);
    },

    transferControl(flightId) {
        const flight = this.flights.find(f => f.id === flightId);
        if (!flight) return null;

        flight.currentControl = flight.nextControl;
        this.updateFlightStatus(flight);
        
        return flight;
    },

    updateFlightStatus(flight) {
        switch(flight.currentControl) {
            case 'GND':
                flight.status = 'taxiing';
                flight.position = '滑行道';
                flight.nextControl = 'TWR';
                break;
            case 'TWR':
                flight.status = 'ready';
                flight.position = '跑道等待点';
                flight.nextControl = 'APP';
                break;
            case 'APP':
                flight.status = 'departed';
                flight.position = '离场区域';
                flight.altitude = 5000;
                flight.nextControl = 'CEN';
                break;
            case 'CEN':
                flight.status = 'cruising';
                flight.position = '航路';
                flight.altitude = 35000;
                flight.nextControl = 'CEN';
                break;
        }
    },

    addFlight(flightInfo) {
        const newFlight = {
            id: Date.now().toString(),
            callsign: flightInfo.callsign,
            status: flightInfo.status,
            currentControl: "DEL",
            nextControl: "GND",
            position: flightInfo.position,
            altitude: 0,
            heading: 0,
            departure: flightInfo.departure,
            destination: flightInfo.destination,
            remarks: flightInfo.remarks || ""
        };
        
        this.flights.push(newFlight);
        return newFlight;
    },

    getStatusText(status) {
        const statusMap = {
            'scheduled': '计划中',
            'boarding': '登机中',
            'taxiing': '滑行中',
            'ready': '准备起飞',
            'departed': '已起飞',
            'cruising': '巡航中'
        };
        return statusMap[status] || status;
    },

    validateCallsign(callsign) {
        const callsignRegex = /^[A-Z]{2,3}\d{1,4}$/;
        return callsignRegex.test(callsign);
    }
};
console.log('✅ 数据模块加载完成');

// ==================== WebSocket客户端 ====================
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
            flightData.flights = flights;
            if (common && auth.getCurrentUser()) {
                common.renderManagedFlights(auth.getCurrentUser().type);
                common.renderAllFlightsTable();
            }
        });

        this.socket.on('flight_updated', (flight) => {
            console.log('🔄 航班更新:', flight.callsign);
            const index = flightData.flights.findIndex(f => f.id === flight.id);
            if (index !== -1) {
                flightData.flights[index] = flight;
            }
            if (common && auth.getCurrentUser()) {
                common.renderManagedFlights(auth.getCurrentUser().type);
                common.renderAllFlightsTable();
            }
        });

        this.socket.on('flight_added', (flight) => {
            console.log('✈️ 新航班添加:', flight.callsign);
            flightData.flights.push(flight);
            if (common && auth.getCurrentUser()) {
                common.renderManagedFlights(auth.getCurrentUser().type);
                common.renderAllFlightsTable();
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

// ==================== 通用功能 ====================
console.log('🛠️ 加载通用功能...');
const common = {
    updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString();
        }
    },

    initTime() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    },

    renderManagedFlights(controlType) {
        const managedFlights = document.getElementById('managedFlights');
        const flights = flightData.getFlightsByControl(controlType);
        
        if (!managedFlights) return;
        
        managedFlights.innerHTML = '';
        
        if (flights.length === 0) {
            managedFlights.innerHTML = '<div class="no-flights">暂无受管航班</div>';
            return;
        }
        
        flights.forEach(flight => {
            const flightCard = document.createElement('div');
            flightCard.className = `flight-card ${controlType.toLowerCase()}-flight`;
            
            flightCard.innerHTML = `
                <div class="flight-header">
                    <div class="callsign">${flight.callsign}</div>
                    <div class="flight-status status-${flight.status}">${flightData.getStatusText(flight.status)}</div>
                </div>
                <div class="flight-details">
                    <div class="flight-route">
                        <span>🛫 ${flight.departure}</span>
                        <span>→</span>
                        <span>🛬 ${flight.destination}</span>
                    </div>
                    <div class="flight-position">📍 ${flight.position}</div>
                    ${flight.altitude > 0 ? `<div class="flight-altitude">⏫ 高度: ${flight.altitude}ft</div>` : ''}
                    ${flight.remarks ? `<div class="flight-remarks">📝 ${flight.remarks}</div>` : ''}
                </div>
                <div class="flight-actions">
                    <button class="action-btn ${flight.nextControl.toLowerCase()}-btn" onclick="common.transferFlight('${flight.id}')">
                        移交 ${flight.nextControl}
                    </button>
                </div>
            `;
            
            managedFlights.appendChild(flightCard);
        });
    },

    renderAllFlightsTable() {
        const tableBody = document.getElementById('allFlightsTable');
        const flights = flightData.getFlights();
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        flights.forEach(flight => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${flight.callsign}</td>
                <td>${flightData.getStatusText(flight.status)}</td>
                <td><span class="control-badge-small ${flight.currentControl.toLowerCase()}-badge">${flight.currentControl}</span></td>
                <td>${flight.position}</td>
                <td>${flight.departure}</td>
                <td>${flight.destination}</td>
                <td>${flight.remarks || '-'}</td>
            `;
            
            tableBody.appendChild(row);
        });
    },

    transferFlight(flightId) {
        const flight = flightData.flights.find(f => f.id === flightId);
        if (!flight) return;

        if (socketClient.transferFlight(
            flightId,
            flight.currentControl,
            flight.nextControl,
            'taxiing',
            '移交中'
        )) {
            alert(`正在将 ${flight.callsign} 移交至 ${flight.nextControl} 管制...`);
        } else {
            const updatedFlight = flightData.transferControl(flightId);
            if (updatedFlight) {
                this.renderManagedFlights(auth.getCurrentUser().type);
                this.renderAllFlightsTable();
                alert(`已将 ${updatedFlight.callsign} 移交至 ${updatedFlight.nextControl} 管制`);
            }
        }
    },

    initPage() {
        const user = auth.requireAuth();
        if (!user) return;

        console.log('👤 初始化用户页面:', user.name);

        // 更新界面元素
        document.getElementById('controlBadge').textContent = `${user.name} (${user.type})`;
        document.getElementById('controlBadge').className = `control-badge ${user.type.toLowerCase()}-badge`;
        document.getElementById('managementTitle').textContent = `${user.name}航班`;
        document.getElementById('managementTitle').className = `panel-title ${user.type.toLowerCase()}-title`;

        // 初始化时间
        this.initTime();

        // 初始化WebSocket
        socketClient.init();
        setTimeout(() => {
            socketClient.login({
                controlType: user.type,
                userName: user.name
            });
        }, 500);

        // 渲染航班数据
        this.renderManagedFlights(user.type);
        this.renderAllFlightsTable();

        // 绑定退出按钮
        document.getElementById('logoutBtn').addEventListener('click', auth.logout);

        // DEL页面特定初始化
        if (window.location.pathname.includes('del.html')) {
            this.initDelPage();
        }
    },

    initDelPage() {
        const addFlightBtn = document.getElementById('addFlightBtn');
        if (addFlightBtn) {
            addFlightBtn.addEventListener('click', this.showAddFlightDialog);
            this.bindDialogEvents();
        }
    },

    showAddFlightDialog() {
        const dialog = document.getElementById('addFlightDialog');
        if (dialog) dialog.style.display = 'flex';
    },

    hideAddFlightDialog() {
        const dialog = document.getElementById('addFlightDialog');
        if (dialog) {
            dialog.style.display = 'none';
            const form = document.getElementById('addFlightForm');
            if (form) form.reset();
        }
    },

    bindDialogEvents() {
        const closeBtn = document.getElementById('closeDialogBtn');
        const cancelBtn = document.getElementById('cancelAddBtn');
        const dialog = document.getElementById('addFlightDialog');
        const form = document.getElementById('addFlightForm');
        
        if (closeBtn) closeBtn.addEventListener('click', () => this.hideAddFlightDialog());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideAddFlightDialog());
        if (dialog) {
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) this.hideAddFlightDialog();
            });
        }
        if (form) form.addEventListener('submit', (e) => this.handleAddFlight(e));
    },

    handleAddFlight(e) {
        e.preventDefault();
        
        const callsign = document.getElementById('callsign')?.value;
        const status = document.getElementById('status')?.value;
        const position = document.getElementById('position')?.value;
        const departure = document.getElementById('departure')?.value;
        const destination = document.getElementById('destination')?.value;
        const remarks = document.getElementById('remarks')?.value;
        
        if (!callsign || !status || !position || !departure || !destination) {
            alert('请填写所有必填字段');
            return;
        }
        
        if (!flightData.validateCallsign(callsign)) {
            alert('航班呼号格式不正确');
            return;
        }
        
        if (flightData.flights.some(flight => flight.callsign === callsign)) {
            alert('该航班呼号已存在');
            return;
        }
        
        if (socketClient.addFlight({
            callsign, status, position, departure, destination,
            remarks: remarks || ""
        })) {
            this.hideAddFlightDialog();
            alert(`成功添加航班 ${callsign}`);
        } else {
            alert('网络连接异常');
        }
    }
};
console.log('✅ 通用功能加载完成');

// ==================== 页面初始化 ====================
console.log('🎯 初始化页面...');

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM加载完成');
    
    // 如果是登录页面，设置登录表单
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const controlType = document.getElementById('controlType').value;
                const password = document.getElementById('password').value;
                
                if (auth.login(controlType, password)) {
                    window.location.href = `/pages/${controlType.toLowerCase()}.html`;
                } else {
                    alert('密码错误');
                    document.getElementById('password').value = '';
                }
            });
        }
    } else {
        // 管制页面初始化
        setTimeout(() => {
            common.initPage();
        }, 100);
    }
});

console.log('🎉 ATC系统加载完成！等待DOM就绪...');