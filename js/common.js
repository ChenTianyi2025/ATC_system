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
            `;
            
            tableBody.appendChild(row);
        });
    },

    transferFlight(flightId) {
        const flight = flightData.transferControl(flightId);
        if (flight) {
            this.renderManagedFlights(auth.getCurrentUser().type);
            this.renderAllFlightsTable();
            alert(`已将 ${flight.callsign} 移交至 ${flight.nextControl} 管制`);
        }
    },

    initPage() {
        const user = auth.requireAuth();
        if (!user) return;

        // 更新界面元素
        document.getElementById('controlBadge').textContent = `${user.name} (${user.type})`;
        document.getElementById('controlBadge').className = `control-badge ${user.type.toLowerCase()}-badge`;
        document.getElementById('managementTitle').textContent = `${user.name}航班`;
        document.getElementById('managementTitle').className = `panel-title ${user.type.toLowerCase()}-title`;

        // 初始化时间
        this.initTime();

        // 渲染航班数据
        this.renderManagedFlights(user.type);
        this.renderAllFlightsTable();

        // 绑定退出按钮
        document.getElementById('logoutBtn').addEventListener('click', auth.logout);
    }
};