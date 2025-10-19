// 调试版本的初始化
console.log('init-debug.js 开始加载');

// 检查全局变量
function checkGlobals() {
    console.log('=== 全局变量检查 ===');
    console.log('auth:', typeof auth);
    console.log('flightData:', typeof flightData);
    console.log('common:', typeof common);
    console.log('socketClient:', typeof socketClient);
    console.log('io:', typeof io);
    console.log('==================');
}

// 简单的初始化函数
function initializeApplication() {
    console.log('开始初始化应用...');
    checkGlobals();
    
    // 如果关键依赖不存在，创建模拟对象
    if (typeof auth === 'undefined') {
        console.warn('auth 未定义，使用模拟对象');
        window.auth = {
            requireAuth: function() { 
                return { type: 'DEL', name: '测试用户' }; 
            },
            logout: function() { window.location.href = '/'; }
        };
    }
    
    if (typeof flightData === 'undefined') {
        console.warn('flightData 未定义，使用模拟对象');
        window.flightData = {
            flights: [],
            getFlightsByControl: function() { return []; },
            getFlights: function() { return []; },
            getStatusText: function(status) { return status; }
        };
    }
    
    if (typeof common === 'undefined') {
        console.warn('common 未定义，使用模拟对象');
        window.common = {
            initPage: function() { 
                console.log('模拟初始化页面');
                document.getElementById('currentTime').textContent = new Date().toLocaleTimeString();
            },
            renderManagedFlights: function() { console.log('渲染航班'); },
            renderAllFlightsTable: function() { console.log('渲染表格'); }
        };
    }
    
    try {
        // 初始化主页面
        common.initPage();
        console.log('应用初始化完成');
        
        // DEL页面特定初始化
        if (window.location.pathname.includes('del.html')) {
            initializeDelPage();
        }
    } catch (error) {
        console.error('初始化失败:', error);
    }
}

// DEL页面特定功能（简化版）
function initializeDelPage() {
    console.log('初始化DEL页面...');
    
    const addFlightBtn = document.getElementById('addFlightBtn');
    if (addFlightBtn) {
        addFlightBtn.addEventListener('click', function() {
            alert('添加航班功能（模拟）');
        });
        console.log('DEL页面功能已初始化');
    }
}

// DOM加载完成后开始初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM内容加载完成');
    console.log('当前URL:', window.location.href);
    console.log('当前路径:', window.location.pathname);
    
    // 立即检查脚本加载状态
    checkGlobals();
    
    // 延迟初始化
    setTimeout(initializeApplication, 1000);
});

console.log('init-debug.js 加载完成');