// 航班数据管理
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
        },
        {
            id: "2",
            callsign: "CES456",
            status: "boarding",
            currentControl: "DEL",
            nextControl: "GND",
            position: "Gate B2",
            altitude: 0,
            heading: 0,
            departure: "VHHH",
            destination: "RJTT",
            remarks: ""
        },
        {
            id: "3",
            callsign: "UAL789",
            status: "taxiing",
            currentControl: "GND",
            nextControl: "TWR",
            position: "Taxiway A",
            altitude: 0,
            heading: 120,
            departure: "VHHH",
            destination: "KSFO",
            remarks: ""
        },
        {
            id: "4",
            callsign: "SIA890",
            status: "ready",
            currentControl: "TWR",
            nextControl: "APP",
            position: "Runway 07R",
            altitude: 0,
            heading: 70,
            departure: "VHHH",
            destination: "WSSS",
            remarks: ""
        },
        {
            id: "5",
            callsign: "AFR234",
            status: "departed",
            currentControl: "APP",
            nextControl: "CEN",
            position: "10NM NE",
            altitude: 5000,
            heading: 45,
            departure: "VHHH",
            destination: "LFPG",
            remarks: ""
        },
        {
            id: "6",
            callsign: "BAW567",
            status: "cruising",
            currentControl: "CEN",
            nextControl: "CEN",
            position: "150NM SW",
            altitude: 35000,
            heading: 320,
            departure: "VHHH",
            destination: "EGLL",
            remarks: ""
        }
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
            'lineup': '跑道外等待',
            'takeoff': '起飞中',
            'departed': '已起飞',
            'climbing': '爬升中',
            'cruising': '巡航中',
            'descending': '下降中',
            'approach': '进近中',
            'final': '五边进近',
            'landing': '着陆中',
            'vectoring': '雷达引导',
            'holding': '等待中',
            'goaround': '复飞',
            'delayed': '延误',
            'cancelled': '取消'
        };
        return statusMap[status] || status;
    },

    validateCallsign(callsign) {
        const callsignRegex = /^[A-Z]{2,3}\d{1,4}$/;
        return callsignRegex.test(callsign);
    }
};