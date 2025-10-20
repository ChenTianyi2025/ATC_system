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
        "CEN": { password: "cen123", name: "区域管制" },
        "CON": { password: "con123", name: "航班管理" }
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
    flights: [], // 初始为空，从服务器加载

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

        this.socket.on('flight_deleted', (data) => {
            console.log('🗑️ 航班删除:', data.callsign);
            const index = flightData.flights.findIndex(f => f.id === data.flightId);
            if (index !== -1) {
                flightData.flights.splice(index, 1);
            }
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
        
        if (!managedFlights) return;
        
        // CON页面不需要左侧管理面板，直接返回
        if (controlType === 'CON') {
            return;
        }
        
        // 其他管制页面显示受管航班
        const flights = flightData.getFlightsByControl(controlType);
        
        managedFlights.innerHTML = '';
        
        if (flights.length === 0) {
            managedFlights.innerHTML = '<div class="no-flights">暂无航班</div>';
            return;
        }
        
        flights.forEach(flight => {
            const flightCard = document.createElement('div');
            flightCard.className = `flight-card ${controlType.toLowerCase()}-flight`;
            
            // 其他管制页面：显示移交按钮
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
                    <button class="action-btn transfer-btn" onclick="common.showTransferDialog('${flight.id}')">
                        移交至
                    </button>
                </div>
            `;
            
            managedFlights.appendChild(flightCard);
        });
    },

    renderAllFlightsTable() {
        const tableBody = document.getElementById('allFlightsTable');
        const flights = flightData.getFlights();
        const currentUser = auth.getCurrentUser();
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        flights.forEach(flight => {
            const row = document.createElement('tr');
            
            if (currentUser && currentUser.type === 'CON') {
                // CON页面：显示复选框和删除按钮
                row.innerHTML = `
                    <td><input type="checkbox" class="flight-checkbox" value="${flight.id}"></td>
                    <td>${flight.callsign}</td>
                    <td>${flightData.getStatusText(flight.status)}</td>
                    <td><span class="control-badge-small ${flight.currentControl.toLowerCase()}-badge">${flight.currentControl}</span></td>
                    <td>${flight.position}</td>
                    <td>${flight.departure}</td>
                    <td>${flight.destination}</td>
                    <td>${flight.remarks || '-'}</td>
                    <td><button class="action-btn delete-btn" onclick="common.deleteFlight('${flight.id}')">删除</button></td>
                `;
            } else {
                // 其他页面：正常显示
                row.innerHTML = `
                    <td>${flight.callsign}</td>
                    <td>${flightData.getStatusText(flight.status)}</td>
                    <td><span class="control-badge-small ${flight.currentControl.toLowerCase()}-badge">${flight.currentControl}</span></td>
                    <td>${flight.position}</td>
                    <td>${flight.departure}</td>
                    <td>${flight.destination}</td>
                    <td>${flight.remarks || '-'}</td>
                `;
            }
            
            tableBody.appendChild(row);
        });
    },

    transferFlight(flightId) {
        const flight = flightData.flights.find(f => f.id === flightId);
        if (!flight) return;

        // 直接执行移交，不显示"正在移交"的提示
        const updatedFlight = flightData.transferControl(flightId);
        if (updatedFlight) {
            // 通过WebSocket通知服务器
            socketClient.transferFlight(
                flightId,
                flight.currentControl,
                flight.nextControl,
                updatedFlight.status,
                updatedFlight.position
            );
            
            // 立即更新本地界面
            this.renderManagedFlights(auth.getCurrentUser().type);
            this.renderAllFlightsTable();
        }
    },

    initPage() {
        const user = auth.requireAuth();
        if (!user) return;

        console.log('👤 初始化用户页面:', user.name);

        // 更新界面元素
        const controlBadge = document.getElementById('controlBadge');
        if (controlBadge) {
            controlBadge.textContent = `${user.name} (${user.type})`;
            controlBadge.className = `control-badge ${user.type.toLowerCase()}-badge`;
        }

        // CON页面不需要managementTitle元素
        const managementTitle = document.getElementById('managementTitle');
        if (managementTitle) {
            managementTitle.textContent = `${user.name}航班`;
            managementTitle.className = `panel-title ${user.type.toLowerCase()}-title`;
        }

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
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', auth.logout);
        }

        // DEL页面特定初始化
        if (window.location.pathname.includes('del.html')) {
            this.initDelPage();
        }

        // CON页面特定初始化
        if (window.location.pathname.includes('con_.html')) {
            this.initConPage();
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
    },

    // 显示移交对话框
    showTransferDialog(flightId) {
        const flight = flightData.flights.find(f => f.id === flightId);
        if (!flight) return;

        const currentUser = auth.getCurrentUser();
        if (!currentUser) return;

        // 创建移交对话框
        const dialog = document.createElement('div');
        dialog.className = 'dialog-overlay';
        dialog.id = 'transferDialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <div class="dialog-title">移交航班 ${flight.callsign}</div>
                    <button class="close-btn" onclick="common.hideTransferDialog()">&times;</button>
                </div>
                <div class="dialog-body">
                    <p>请选择要移交到的管制单位：</p>
                    <div class="transfer-options">
                        ${this.getTransferOptions(currentUser.type, flight)}
                    </div>
                </div>
                <div class="dialog-actions">
                    <button class="cancel-btn" onclick="common.hideTransferDialog()">取消</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
        dialog.style.display = 'flex';
    },

    // 获取移交选项
    getTransferOptions(currentControl, flight) {
        const controlTypes = {
            'DEL': { name: '签派', next: 'GND' },
            'GND': { name: '地面', next: 'TWR' },
            'TWR': { name: '塔台', next: 'APP' },
            'APP': { name: '进近', next: 'CEN' },
            'CEN': { name: '区域', next: 'CEN' }
        };

        let options = '';
        
        // 根据当前管制类型提供合理的移交选项
        switch(currentControl) {
            case 'DEL':
                options = `
                    <button class="transfer-option-btn gnd-btn" onclick="common.executeTransfer('${flight.id}', 'GND')">
                        地面管制 (GND)
                    </button>
                `;
                break;
            case 'GND':
                options = `
                    <button class="transfer-option-btn twr-btn" onclick="common.executeTransfer('${flight.id}', 'TWR')">
                        塔台管制 (TWR)
                    </button>
                    <button class="transfer-option-btn del-btn" onclick="common.executeTransfer('${flight.id}', 'DEL')">
                        返回签派 (DEL)
                    </button>
                `;
                break;
            case 'TWR':
                options = `
                    <button class="transfer-option-btn app-btn" onclick="common.executeTransfer('${flight.id}', 'APP')">
                        进近管制 (APP)
                    </button>
                    <button class="transfer-option-btn gnd-btn" onclick="common.executeTransfer('${flight.id}', 'GND')">
                        返回地面 (GND)
                    </button>
                `;
                break;
            case 'APP':
                options = `
                    <button class="transfer-option-btn cen-btn" onclick="common.executeTransfer('${flight.id}', 'CEN')">
                        区域管制 (CEN)
                    </button>
                    <button class="transfer-option-btn twr-btn" onclick="common.executeTransfer('${flight.id}', 'TWR')">
                        返回塔台 (TWR)
                    </button>
                `;
                break;
            case 'CEN':
                options = `
                    <button class="transfer-option-btn app-btn" onclick="common.executeTransfer('${flight.id}', 'APP')">
                        返回进近 (APP)
                    </button>
                `;
                break;
        }

        return options;
    },

    // 执行移交
    executeTransfer(flightId, toControl) {
        const flight = flightData.flights.find(f => f.id === flightId);
        if (!flight) return;

        const fromControl = flight.currentControl;
        
        // 通过WebSocket通知服务器执行移交
        let newStatus = 'taxiing';
        let newPosition = '移交中';
        
        // 根据目标管制单位设置状态和位置
        switch(toControl) {
            case 'DEL':
                newStatus = 'scheduled';
                newPosition = '登机口';
                break;
            case 'GND':
                newStatus = 'taxiing';
                newPosition = '滑行道';
                break;
            case 'TWR':
                newStatus = 'ready';
                newPosition = '跑道等待点';
                break;
            case 'APP':
                newStatus = 'departed';
                newPosition = '离场区域';
                break;
            case 'CEN':
                newStatus = 'cruising';
                newPosition = '航路';
                break;
        }

        // 通过WebSocket通知服务器
        if (socketClient.transferFlight(
            flightId,
            fromControl,
            toControl,
            newStatus,
            newPosition
        )) {
            // 隐藏对话框
            this.hideTransferDialog();
        }
    },

    // 根据移交目标更新航班状态
    updateFlightStatusForTransfer(flight, toControl) {
        switch(toControl) {
            case 'DEL':
                flight.status = 'scheduled';
                flight.position = '登机口';
                flight.nextControl = 'GND';
                flight.altitude = 0;
                break;
            case 'GND':
                flight.status = 'taxiing';
                flight.position = '滑行道';
                flight.nextControl = 'TWR';
                flight.altitude = 0;
                break;
            case 'TWR':
                flight.status = 'ready';
                flight.position = '跑道等待点';
                flight.nextControl = 'APP';
                flight.altitude = 0;
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

    // 隐藏移交对话框
    hideTransferDialog() {
        const dialog = document.getElementById('transferDialog');
        if (dialog) {
            dialog.remove();
        }
    },

    // 删除航班
    deleteFlight(flightId) {
        const flight = flightData.flights.find(f => f.id === flightId);
        if (!flight) return;

        if (confirm(`确定要删除航班 ${flight.callsign} 吗？此操作不可撤销。`)) {
            // 从本地数组中删除
            const index = flightData.flights.findIndex(f => f.id === flightId);
            if (index !== -1) {
                flightData.flights.splice(index, 1);
            }

            // 通过WebSocket通知服务器删除
            if (socketClient.isConnected) {
                socketClient.socket.emit('flight_delete', { flightId });
            }

            // 更新界面
            this.renderManagedFlights(auth.getCurrentUser().type);
            this.renderAllFlightsTable();

            alert(`航班 ${flight.callsign} 已删除`);
        }
    },

    // 全选/取消全选
    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const flightCheckboxes = document.querySelectorAll('.flight-checkbox');
        
        flightCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        
        this.updateDeleteSelectedButton();
    },

    // 更新删除选中按钮状态
    updateDeleteSelectedButton() {
        const selectedCheckboxes = document.querySelectorAll('.flight-checkbox:checked');
        const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        
        if (deleteSelectedBtn) {
            deleteSelectedBtn.style.display = selectedCheckboxes.length > 0 ? 'block' : 'none';
        }
    },

    // CON页面初始化
    initConPage() {
        // 绑定全选复选框事件
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => this.toggleSelectAll());
        }

        // 绑定删除选中按钮事件
        const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', () => this.deleteSelectedFlights());
        }

        // 绑定单个复选框事件
        document.addEventListener('change', (e) => {
            if (e.target && e.target.classList.contains('flight-checkbox')) {
                this.updateDeleteSelectedButton();
            }
        });
    },

    // 删除选中的航班
    deleteSelectedFlights() {
        const selectedCheckboxes = document.querySelectorAll('.flight-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            alert('请先选择要删除的航班');
            return;
        }

        const flightIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        const callsigns = flightIds.map(id => {
            const flight = flightData.flights.find(f => f.id === id);
            return flight ? flight.callsign : '';
        }).filter(Boolean);

        if (confirm(`确定要删除以下 ${flightIds.length} 个航班吗？\n${callsigns.join(', ')}\n此操作不可撤销。`)) {
            // 删除航班
            flightIds.forEach(flightId => {
                const index = flightData.flights.findIndex(f => f.id === flightId);
                if (index !== -1) {
                    flightData.flights.splice(index, 1);
                }

                // 通知服务器删除
                if (socketClient.isConnected) {
                    socketClient.socket.emit('flight_delete', { flightId });
                }
            });

            // 更新界面
            this.renderManagedFlights(auth.getCurrentUser().type);
            this.renderAllFlightsTable();

            alert(`已删除 ${flightIds.length} 个航班`);
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
                    // CON页面特殊处理，跳转到con_.html
                    if (controlType === 'CON') {
                        window.location.href = '/pages/con_.html';
                    } else {
                        window.location.href = `/pages/${controlType.toLowerCase()}.html`;
                    }
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
