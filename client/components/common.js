// ATC系统通用功能模块
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
        
        if (!managedFlights) {
            console.warn('⚠️ managedFlights 元素未找到');
            return;
        }
        
        // CON页面不需要左侧管理面板，直接返回
        if (controlType === 'CON') {
            return;
        }
        
        // 其他管制页面显示受管航班
        const flights = typeof flightData !== 'undefined' ? flightData.getFlightsByControl(controlType) : [];
        
        console.log(`🔄 渲染 ${controlType} 管制航班:`, flights.length, '个航班');
        
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
                    <div class="flight-status status-${flight.status}">${typeof flightData !== 'undefined' ? flightData.getStatusText(flight.status) : flight.status}</div>
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
        const flights = typeof flightData !== 'undefined' ? flightData.getFlights() : [];
        const currentUser = typeof auth !== 'undefined' ? auth.getCurrentUser() : null;
        
        if (!tableBody) {
            console.warn('⚠️ allFlightsTable 元素未找到');
            return;
        }
        
        console.log('🔄 渲染所有航班表格:', flights.length, '个航班');
        
        tableBody.innerHTML = '';
        
        flights.forEach(flight => {
            const row = document.createElement('tr');
            
            if (currentUser && currentUser.type === 'CON') {
                // CON页面：显示复选框和删除按钮
                row.innerHTML = `
                    <td><input type="checkbox" class="flight-checkbox" value="${flight.id}"></td>
                    <td>${flight.callsign}</td>
                    <td>${typeof flightData !== 'undefined' ? flightData.getStatusText(flight.status) : flight.status}</td>
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
                    <td>${typeof flightData !== 'undefined' ? flightData.getStatusText(flight.status) : flight.status}</td>
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
        if (typeof flightData === 'undefined') return;

        const flight = flightData.flights.find(f => f.id === flightId);
        if (!flight) return;

        // 直接执行移交，不显示"正在移交"的提示
        const updatedFlight = flightData.transferControl(flightId);
        if (updatedFlight) {
            // 通过WebSocket通知服务器
            if (typeof socketClient !== 'undefined') {
                socketClient.transferFlight(
                    flightId,
                    flight.currentControl,
                    flight.nextControl,
                    updatedFlight.status,
                    updatedFlight.position
                );
            }
            
            // 立即更新本地界面
            const user = typeof auth !== 'undefined' ? auth.getCurrentUser() : null;
            if (user) {
                console.log('🔄 移交后更新本地界面...');
                this.renderManagedFlights(user.type);
                this.renderAllFlightsTable();
            }
        }
    },

    initPage() {
        // 信息大屏页面不需要强制认证
        const excludePaths = ['/pages/info.html'];
        const user = typeof auth !== 'undefined' ? auth.requireAuth(excludePaths) : null;
        // 信息大屏页面可以继续初始化，即使没有用户登录
        if (!user && !excludePaths.includes(window.location.pathname)) return;

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
        if (typeof socketClient !== 'undefined') {
            socketClient.init();
            setTimeout(() => {
                socketClient.login({
                    controlType: user.type,
                    userName: user.name
                });
            }, 500);
        }

        // 渲染航班数据
        this.renderManagedFlights(user.type);
        this.renderAllFlightsTable();

        // 绑定退出按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (typeof auth !== 'undefined') {
                    auth.logout();
                }
            });
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
            addFlightBtn.addEventListener('click', () => this.showAddFlightDialog());
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
        
        if (typeof flightData !== 'undefined' && !flightData.validateCallsign(callsign)) {
            alert('航班呼号格式不正确');
            return;
        }
        
        if (typeof flightData !== 'undefined' && flightData.flights.some(flight => flight.callsign === callsign)) {
            alert('该航班呼号已存在');
            return;
        }
        
        if (typeof socketClient !== 'undefined' && socketClient.addFlight({
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
        if (typeof flightData === 'undefined') return;
        
        const flight = flightData.flights.find(f => f.id === flightId);
        if (!flight) return;

        const currentUser = typeof auth !== 'undefined' ? auth.getCurrentUser() : null;
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
        if (typeof flightData === 'undefined') return;
        
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
        if (typeof socketClient !== 'undefined' && socketClient.transferFlight(
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
        if (typeof flightData === 'undefined') return;
        
        const flight = flightData.flights.find(f => f.id === flightId);
        if (!flight) return;

        if (confirm(`确定要删除航班 ${flight.callsign} 吗？此操作不可撤销。`)) {
            // 从本地数组中删除
            const index = flightData.flights.findIndex(f => f.id === flightId);
            if (index !== -1) {
                flightData.flights.splice(index, 1);
            }

            // 通过WebSocket通知服务器删除
            if (typeof socketClient !== 'undefined' && socketClient.isConnected) {
                socketClient.socket.emit('flight_delete', { flightId });
            }

            // 更新界面
            const user = typeof auth !== 'undefined' ? auth.getCurrentUser() : null;
            if (user) {
                this.renderManagedFlights(user.type);
                this.renderAllFlightsTable();
            }

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
            if (typeof flightData === 'undefined') return '';
            const flight = flightData.flights.find(f => f.id === id);
            return flight ? flight.callsign : '';
        }).filter(Boolean);

        if (confirm(`确定要删除以下 ${flightIds.length} 个航班吗？\n${callsigns.join(', ')}\n此操作不可撤销。`)) {
            // 删除航班
            flightIds.forEach(flightId => {
                if (typeof flightData === 'undefined') return;
                const index = flightData.flights.findIndex(f => f.id === flightId);
                if (index !== -1) {
                    flightData.flights.splice(index, 1);
                }

                // 通知服务器删除
                if (typeof socketClient !== 'undefined' && socketClient.isConnected) {
                    socketClient.socket.emit('flight_delete', { flightId });
                }
            });

            // 更新界面
            const user = typeof auth !== 'undefined' ? auth.getCurrentUser() : null;
            if (user) {
                this.renderManagedFlights(user.type);
                this.renderAllFlightsTable();
            }

            alert(`已删除 ${flightIds.length} 个航班`);
        }
    },

    // 显示航班移交提示
    showTransferNotification(data) {
        const user = typeof auth !== 'undefined' ? auth.getCurrentUser() : null;
        if (!user) return;

        // 只在接收移交的管制单位显示提示
        if (data.toControl !== user.type) return;

        // 移除已存在的提示
        const existingNotification = document.getElementById('transferNotification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 创建提示元素
        const notification = document.createElement('div');
        notification.id = 'transferNotification';
        notification.className = 'transfer-notification';
        
        const time = new Date(data.timestamp).toLocaleTimeString();
        
        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">📡 航班移交通知</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="notification-content">
                航班 <span class="notification-flight">${data.flight.callsign}</span> 已从 
                <span class="notification-flight">${data.fromControl}</span> 移交至您所在的 
                <span class="notification-flight">${data.toControl}</span> 管制单位
            </div>
            <div class="notification-time">${time}</div>
        `;

        document.body.appendChild(notification);

        // 显示提示
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // 自动隐藏提示
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 8000); // 8秒后自动隐藏
    }
};

console.log('✅ 通用功能加载完成');
export default common;