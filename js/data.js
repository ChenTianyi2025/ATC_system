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
            destination: "ZBAA"
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
            destination: "RJTT"
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
            destination: "KSFO"
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
            destination: "WSSS"
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
            destination: "LFPG"
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
            destination: "EGLL"
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
    }
};