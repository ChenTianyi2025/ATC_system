// 航班服务层
const { updateToTiny, deleteFromTiny } = require('../tingwebdb_server.js');

class FlightService {
    constructor(flightData) {
        this.flightData = flightData;
    }

    // 同步航班到TinyWebDB
    async syncFlightToTinyWebDB(flight) {
        try {
            const flightData = {
                id: flight.id,
                status: flight.status,
                currentControl: flight.currentControl,
                nextControl: flight.nextControl,
                position: flight.position,
                altitude: flight.altitude,
                heading: flight.heading,
                departure: flight.departure,
                destination: flight.destination,
                remarks: flight.remarks,
                lastUpdated: new Date().toISOString()
            };
            
            await updateToTiny(flight.callsign, flightData);
            console.log(`✈️ 航班 ${flight.callsign} 已同步到TinyWebDB`);
            return true;
        } catch (error) {
            console.error(`❌ 航班 ${flight.callsign} 同步到TinyWebDB失败:`, error.message);
            return false;
        }
    }

    // 从TinyWebDB删除航班数据
    async deleteFlightFromTinyWebDB(callsign) {
        try {
            await deleteFromTiny(callsign);
            console.log(`🗑️ 航班 ${callsign} 已从TinyWebDB删除`);
            return true;
        } catch (error) {
            console.error(`❌ 航班 ${callsign} 从TinyWebDB删除失败:`, error.message);
            return false;
        }
    }

    // 更新航班并同步到TinyWebDB
    async updateFlight(updatedFlight) {
        const flight = this.flightData.updateFlight(updatedFlight);
        if (flight) {
            await this.syncFlightToTinyWebDB(flight);
            return flight;
        }
        return null;
    }

    // 添加新航班并同步到TinyWebDB
    async addFlight(flightData) {
        const newFlight = this.flightData.addFlight(flightData);
        if (newFlight) {
            await this.syncFlightToTinyWebDB(newFlight);
            return newFlight;
        }
        return null;
    }

    // 删除航班并从TinyWebDB删除
    async deleteFlight(flightId) {
        const flight = this.flightData.getFlightById(flightId);
        if (flight) {
            const deletedFlight = this.flightData.deleteFlight(flightId);
            if (deletedFlight) {
                await this.deleteFlightFromTinyWebDB(deletedFlight.callsign);
                return deletedFlight;
            }
        }
        return null;
    }

    // 航班移交并同步到TinyWebDB
    async transferFlight(flightId, fromControl, toControl, newStatus, newPosition) {
        const flight = this.flightData.transferFlight(flightId, toControl, newStatus, newPosition);
        if (flight) {
            await this.syncFlightToTinyWebDB(flight);
            return flight;
        }
        return null;
    }

    // 获取所有航班
    getAllFlights() {
        return this.flightData.getAllFlights();
    }

    // 根据ID获取航班
    getFlightById(id) {
        return this.flightData.getFlightById(id);
    }

    // 根据呼号获取航班
    getFlightByCallsign(callsign) {
        return this.flightData.getFlightByCallsign(callsign);
    }

    // 根据管制单位获取航班
    getFlightsByControl(controlType) {
        return this.flightData.getFlightsByControl(controlType);
    }
}

module.exports = FlightService;
