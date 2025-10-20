// ATC系统主应用程序入口
console.log('🚀 ATC系统开始加载...');

// 导入所有模块
import auth from '../components/auth.js';
import flightData from '../components/flightData.js';
import socketClient from '../components/socketClient.js';
import common from '../components/common.js';

// 将模块挂载到全局对象以便在HTML中使用
window.auth = auth;
window.flightData = flightData;
window.socketClient = socketClient;
window.common = common;

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
