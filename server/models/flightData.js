// 航班数据访问层
const fs = require('fs');
const path = require('path');
const Flight = require('./flight');

class FlightData {
    constructor() {
        this.filePath = path.join(__dirname, '../flights.json');
        this.flights = this.loadFlights();
    }

    // 初始化航班数据
    initializeFlights() {
        if (!fs.existsSync(this.filePath)) {
            const initialFlights = [
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
            ];
            this.saveFlights(initialFlights);
            return initialFlights.map(flight => new Flight(flight));
        }
        return this.loadFlights();
    }

    // 保存航班数据到文件
    saveFlights(flights) {
        try {
            const dataToSave = flights.map(flight => 
                flight instanceof Flight ? flight.toJSON() : flight
            );
            fs.writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2));
            console.log('航班数据已保存');
        } catch (error) {
            console.error('保存航班数据失败:', error);
        }
    }

    // 从文件加载航班数据
    loadFlights() {
        try {
            if (!fs.existsSync(this.filePath)) {
                return this.initializeFlights();
            }
            const data = fs.readFileSync(this.filePath, 'utf8');
            const flightsData = JSON.parse(data);
            return flightsData.map(flight => new Flight(flight));
        } catch (error) {
            console.error('加载航班数据失败:', error);
            return [];
        }
    }

    // 获取所有航班
    getAllFlights() {
        return this.flights;
    }

    // 根据ID获取航班
    getFlightById(id) {
        return this.flights.find(flight => flight.id === id);
    }

    // 根据呼号获取航班
    getFlightByCallsign(callsign) {
        return this.flights.find(flight => flight.callsign === callsign);
    }

    // 根据管制单位获取航班
    getFlightsByControl(controlType) {
        return this.flights.filter(flight => flight.currentControl === controlType);
    }

    // 更新航班
    updateFlight(updatedFlight) {
        const index = this.flights.findIndex(f => f.id === updatedFlight.id);
        if (index !== -1) {
            this.flights[index] = new Flight({ ...this.flights[index].toJSON(), ...updatedFlight });
            this.saveFlights(this.flights);
            return this.flights[index];
        }
        return null;
    }

    // 添加新航班
    addFlight(flightData) {
        const newFlight = new Flight({
            id: Date.now().toString(),
            ...flightData,
            currentControl: "DEL",
            nextControl: "GND",
            altitude: 0,
            heading: 0
        });
        this.flights.push(newFlight);
        this.saveFlights(this.flights);
        return newFlight;
    }

    // 删除航班
    deleteFlight(flightId) {
        const index = this.flights.findIndex(f => f.id === flightId);
        if (index !== -1) {
            const deletedFlight = this.flights[index];
            this.flights.splice(index, 1);
            this.saveFlights(this.flights);
            return deletedFlight;
        }
        return null;
    }

    // 航班移交
    transferFlight(flightId, toControl, newStatus, newPosition) {
        const flight = this.getFlightById(flightId);
        if (flight) {
            const updatedFlight = {
                id: flightId,
                currentControl: toControl,
                status: newStatus,
                position: newPosition
            };
            
            // 根据目标管制单位设置下一个管制
            switch(toControl) {
                case 'DEL':
                    updatedFlight.nextControl = 'GND';
                    break;
                case 'GND':
                    updatedFlight.nextControl = 'TWR';
                    break;
                case 'TWR':
                    updatedFlight.nextControl = 'APP';
                    break;
                case 'APP':
                    updatedFlight.nextControl = 'CEN';
                    break;
                case 'CEN':
                    updatedFlight.nextControl = 'CEN';
                    break;
            }

            return this.updateFlight(updatedFlight);
        }
        return null;
    }
}

module.exports = FlightData;
