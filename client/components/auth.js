// ATC系统认证模块
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

    requireAuth(excludePaths = []) {
        // 检查是否在排除路径中
        const currentPath = window.location.pathname;
        if (excludePaths.includes(currentPath)) {
            return this.getCurrentUser(); // 返回用户信息但不强制跳转
        }
        
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = '/';
            return null;
        }
        return user;
    }
};

console.log('✅ 认证模块加载完成');
export default auth;
