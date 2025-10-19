// 通用功能
console.log('common.js 加载');

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
        if (!managedFlights) {
            console.error('managedFlights 元素未找到');
            return;
        }
        
        const flights = flightData.getFlightsByControl(controlType);
        console.log('渲染受管航班:', flights.length);
        
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
        if (!tableBody) {
            console.error('allFlightsTable 元素未找到');
            return;
        }
        
        const flights = flightData.getFlights();
        console.log('渲染所有航班表格:', flights.length);
        
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
        console.log('移交航班:', flightId);
        const flight = flightData.flights.find(f => f.id === flightId);
        if (!flight) return;

        // 使用WebSocket进行实时移交
        if (typeof socketClient !== 'undefined' && socketClient.transferFlight) {
            const success = socketClient.transferFlight(
                flightId,
                flight.currentControl,
                flight.nextControl,
                'taxiing',
                '移交中'
            );

            if (success) {
                alert(`正在将 ${flight.callsign} 移交至 ${flight.nextControl} 管制...`);
            } else {
                alert('网络连接异常，移交失败');
            }
        } else {
            // 本地模式
            const updatedFlight = flightData.transferControl(flightId);
            if (updatedFlight) {
                this.renderManagedFlights(auth.getCurrentUser().type);
                this.renderAllFlightsTable();
                alert(`已将 ${updatedFlight.callsign} 移交至 ${updatedFlight.nextControl} 管制`);
            }
        }
    },

    initPage() {
        console.log('common.initPage 开始执行');
        const user = auth.requireAuth();
        if (!user) return;

        console.log('初始化页面，当前用户:', user);

        // 更新界面元素
        document.getElementById('controlBadge').textContent = `${user.name} (${user.type})`;
        document.getElementById('controlBadge').className = `control-badge ${user.type.toLowerCase()}-badge`;
        document.getElementById('managementTitle').textContent = `${user.name}航班`;
        document.getElementById('managementTitle').className = `panel-title ${user.type.toLowerCase()}-title`;

        // 初始化时间
        this.initTime();

        // 初始化WebSocket连接
        if (typeof socketClient !== 'undefined') {
            console.log('初始化WebSocket连接...');
            socketClient.init();
            
            // 用户登录WebSocket
            setTimeout(() => {
                if (socketClient.socket) {
                    socketClient.login({
                        controlType: user.type,
                        userName: user.name
                    });
                    console.log('WebSocket登录完成');
                }
            }, 500);
        } else {
            console.warn('socketClient未定义，使用本地模式');
        }

        // 渲染航班数据
        this.renderManagedFlights(user.type);
        this.renderAllFlightsTable();

        // 绑定退出按钮
        document.getElementById('logoutBtn').addEventListener('click', auth.logout);
        
        console.log('common.initPage 执行完成');
    }
};

console.log('common.js 初始化完成');