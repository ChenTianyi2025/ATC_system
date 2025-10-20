// 用户管理模型
class User {
    constructor(socketId, controlType, userName) {
        this.id = socketId;
        this.controlType = controlType;
        this.userName = userName;
        this.loginTime = new Date().toISOString();
    }

    // 转换为JSON对象
    toJSON() {
        return {
            id: this.id,
            controlType: this.controlType,
            userName: this.userName,
            loginTime: this.loginTime
        };
    }
}

// 用户认证管理
class UserManager {
    constructor() {
        this.users = new Map();
        this.validUsers = {
            "DEL": { password: "del123", name: "签派管制" },
            "GND": { password: "gnd123", name: "地面管制" },
            "TWR": { password: "twr123", name: "塔台管制" },
            "APP": { password: "app123", name: "进近管制" },
            "CEN": { password: "cen123", name: "区域管制" },
            "CON": { password: "con123", name: "航班管理" }
        };
    }

    // 用户登录验证
    authenticate(controlType, password) {
        const user = this.validUsers[controlType];
        if (user && user.password === password) {
            return {
                type: controlType,
                name: user.name
            };
        }
        return null;
    }

    // 添加已连接用户
    addUser(socketId, controlType, userName) {
        const user = new User(socketId, controlType, userName);
        this.users.set(socketId, user);
        return user;
    }

    // 移除已断开用户
    removeUser(socketId) {
        return this.users.delete(socketId);
    }

    // 获取用户
    getUser(socketId) {
        return this.users.get(socketId);
    }

    // 获取所有用户
    getAllUsers() {
        return Array.from(this.users.values());
    }

    // 根据管制类型获取用户
    getUsersByControl(controlType) {
        return Array.from(this.users.values()).filter(user => user.controlType === controlType);
    }
}

module.exports = { User, UserManager };
