// ATC系统数据管理模块
console.log('📊 加载数据模块...');

const flightData = {
    flights: [], // 初始为空，从服务器加载

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

    addFlight(flightInfo) {
        const newFlight = {
            id: Date.now().toString(),
            callsign: flightInfo.callsign,
            status: flightInfo.status,
            currentControl: "DEL",
            nextControl: "GND",
            position: flightInfo.position,
            altitude: 0,
            heading: 0,
            departure: flightInfo.departure,
            destination: flightInfo.destination,
            remarks: flightInfo.remarks || ""
        };
        
        this.flights.push(newFlight);
        return newFlight;
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

console.log('✅ 数据模块加载完成');
export default flightData;
