// 航班数据模型
class Flight {
    constructor(data) {
        this.id = data.id || Date.now().toString();
        this.callsign = data.callsign;
        this.status = data.status;
        this.currentControl = data.currentControl;
        this.nextControl = data.nextControl;
        this.position = data.position;
        this.altitude = data.altitude || 0;
        this.heading = data.heading || 0;
        this.departure = data.departure;
        this.destination = data.destination;
        this.remarks = data.remarks || "";
    }

    // 更新航班状态
    updateStatus(newStatus) {
        this.status = newStatus;
        switch(newStatus) {
            case 'scheduled':
                this.position = '登机口';
                this.altitude = 0;
                break;
            case 'boarding':
                this.position = '登机口';
                this.altitude = 0;
                break;
            case 'taxiing':
                this.position = '滑行道';
                this.altitude = 0;
                break;
            case 'ready':
                this.position = '跑道等待点';
                this.altitude = 0;
                break;
            case 'departed':
                this.position = '离场区域';
                this.altitude = 5000;
                break;
            case 'cruising':
                this.position = '航路';
                this.altitude = 35000;
                break;
        }
    }

    // 获取状态中文描述
    getStatusText() {
        const statusMap = {
            'scheduled': '计划中',
            'boarding': '登机中',
            'taxiing': '滑行中',
            'ready': '准备起飞',
            'departed': '已起飞',
            'cruising': '巡航中'
        };
        return statusMap[this.status] || this.status;
    }

    // 转换为JSON对象
    toJSON() {
        return {
            id: this.id,
            callsign: this.callsign,
            status: this.status,
            currentControl: this.currentControl,
            nextControl: this.nextControl,
            position: this.position,
            altitude: this.altitude,
            heading: this.heading,
            departure: this.departure,
            destination: this.destination,
            remarks: this.remarks
        };
    }
}

module.exports = Flight;
