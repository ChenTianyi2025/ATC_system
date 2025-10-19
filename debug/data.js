// 航班数据管理
console.log('data.js 加载');

const flightData = {
    flights: [
        {
            id: "1",
            callsign: "CPA123",
            status: "scheduled",
            currentControl: "DEL",
            nextControl: "GND",
            position: "Gate A1",
            altitude: 0,
            heading: 0,
            departure: "VHHH",
            destination: "ZBAA",
            remarks: ""
        }
        // 可以只保留一个航班用于测试
    ],

    getFlights() {
        return this.flights;
    },

    getFlightsByControl(controlType) {
        return this.flights.filter(flight => flight.currentControl === controlType);
    },

    transferControl(flightId) {
        const flight = this.flights.find(f => f.id === flightId);
        if (!flight) return null;

        flight.currentControl = flight.nextControl;
        this.updateFlightStatus(flight);
        
        return flight;
    },

    updateFlightStatus(flight) {
        switch(flight.currentControl) {
            case 'GND':
                flight.status = 'taxiing';
                flight.position = '滑行道';
                flight.nextControl = 'TWR';
                break;
            case 'TWR':
                flight.status = 'ready';
                flight.position = '跑道等待点';
                flight.nextControl = 'APP';
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

    getStatusText(status) {
        const statusMap = {
            'scheduled': '计划中',
            'boarding': '登机中',
            'taxiing': '滑行中',
            'ready': '准备起飞',
            'departed': '已起飞',
            'cruising': '巡航中'
        };
        return statusMap[status] || status;
    },

    validateCallsign(callsign) {
        const callsignRegex = /^[A-Z]{2,3}\d{1,4}$/;
        return callsignRegex.test(callsign);
    }
};

console.log('data.js 初始化完成');