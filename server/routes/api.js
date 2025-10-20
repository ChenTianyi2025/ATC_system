// API路由定义
const express = require('express');
const router = express.Router();

// 路由控制器
let flightController = null;

// 设置控制器
function setController(controller) {
    flightController = controller;
}

// API路由 - 获取航班数据
router.get('/flights', (req, res) => {
    if (flightController) {
        flightController.getFlights(req, res);
    } else {
        res.status(500).json({ error: 'Controller not initialized' });
    }
});

// API路由 - 健康检查
router.get('/health', (req, res) => {
    if (flightController) {
        flightController.healthCheck(req, res);
    } else {
        res.status(500).json({ error: 'Controller not initialized' });
    }
});

// API路由 - 测试TinyWebDB同步
router.get('/sync-to-tiny', async (req, res) => {
    if (flightController) {
        await flightController.syncToTiny(req, res);
    } else {
        res.status(500).json({ error: 'Controller not initialized' });
    }
});

// API路由 - 从TinyWebDB查询航班
router.get('/query-tiny', async (req, res) => {
    if (flightController) {
        await flightController.queryTiny(req, res);
    } else {
        res.status(500).json({ error: 'Controller not initialized' });
    }
});

// API路由 - 信息大屏获取数据
router.get('/info-screen-data', async (req, res) => {
    if (flightController) {
        await flightController.getInfoScreenData(req, res);
    } else {
        res.status(500).json({ error: 'Controller not initialized' });
    }
});

module.exports = { router, setController };
