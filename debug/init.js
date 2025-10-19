// 应用初始化
console.log('🎯 init.js 开始加载');

// 全局初始化函数
function initializeApplication() {
    console.log('🚀 开始初始化应用...');
    
    // 检查所有必要的全局变量
    const requiredGlobals = ['auth', 'flightData', 'common', 'socketClient'];
    const missing = requiredGlobals.filter(g => typeof window[g] === 'undefined');
    
    if (missing.length > 0) {
        console.warn(`⚠️ 缺少全局变量: ${missing.join(', ')}`);
        console.log('🕒 3秒后重试初始化...');
        setTimeout(initializeApplication, 3000);
        return;
    }
    
    console.log('✅ 所有依赖已就绪:', requiredGlobals.join(', '));
    
    try {
        // 初始化主页面
        const user = auth.requireAuth();
        if (!user) {
            console.log('⏩ 用户未登录，跳过页面初始化');
            return;
        }
        
        console.log(`👤 初始化用户页面: ${user.name} (${user.type})`);
        common.initPage();
        
        // DEL页面特定初始化
        if (window.location.pathname.includes('del.html')) {
            console.log('📍 初始化DEL页面特定功能');
            initializeDelPage();
        }
        
        console.log('🎉 应用初始化完成！');
        
    } catch (error) {
        console.error('💥 初始化过程中出错:', error);
    }
}

// DEL页面特定功能
function initializeDelPage() {
    console.log('🛫 初始化DEL页面添加航班功能...');
    
    const addFlightBtn = document.getElementById('addFlightBtn');
    if (addFlightBtn) {
        addFlightBtn.addEventListener('click', showAddFlightDialog);
        bindDialogEvents();
        console.log('✅ DEL页面功能已初始化');
    } else {
        console.warn('⚠️ 未找到添加航班按钮');
    }
}

function showAddFlightDialog() {
    const dialog = document.getElementById('addFlightDialog');
    if (dialog) {
        dialog.style.display = 'flex';
        console.log('📋 打开添加航班对话框');
    }
}

function hideAddFlightDialog() {
    const dialog = document.getElementById('addFlightDialog');
    if (dialog) {
        dialog.style.display = 'none';
        const form = document.getElementById('addFlightForm');
        if (form) form.reset();
        console.log('📋 关闭添加航班对话框');
    }
}

function bindDialogEvents() {
    console.log('🔗 绑定对话框事件...');
    
    const closeBtn = document.getElementById('closeDialogBtn');
    const cancelBtn = document.getElementById('cancelAddBtn');
    const dialog = document.getElementById('addFlightDialog');
    const form = document.getElementById('addFlightForm');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideAddFlightDialog);
        console.log('✅ 绑定关闭按钮');
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideAddFlightDialog);
        console.log('✅ 绑定取消按钮');
    }
    if (dialog) {
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) hideAddFlightDialog();
        });
        console.log('✅ 绑定外部点击关闭');
    }
    if (form) {
        form.addEventListener('submit', handleAddFlight);
        console.log('✅ 绑定表单提交');
    }
}

function handleAddFlight(e) {
    e.preventDefault();
    console.log('🛫 处理添加航班请求...');
    
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
        alert('航班呼号格式不正确，请使用3个字母+数字的组合（如CPA123）');
        return;
    }
    
    if (typeof flightData !== 'undefined' && flightData.flights.some(flight => flight.callsign === callsign)) {
        alert('该航班呼号已存在，请使用其他呼号');
        return;
    }
    
    if (typeof socketClient !== 'undefined' && socketClient.addFlight) {
        const success = socketClient.addFlight({
            callsign,
            status,
            position,
            departure,
            destination,
            remarks: remarks || ""
        });
        
        if (success) {
            hideAddFlightDialog();
            alert(`✅ 成功添加航班 ${callsign}`);
            console.log(`✈️ 航班 ${callsign} 添加成功`);
        } else {
            alert('❌ 网络连接异常，添加航班失败');
        }
    } else {
        alert('⚠️ 实时功能未就绪，无法添加航班');
    }
}

console.log('✅ init.js 加载完成 - 等待调用');