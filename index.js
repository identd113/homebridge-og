const OpenGarageModule = require("./lib/open_garage.js")
const OpenGarageApiModule = require("./lib/open_garage_api.js")

let Service
let Characteristic

class OpenGarageConnect {
    constructor(log, config) {
        const debugEnabled = !!config.debug

        const OpenGarageApi = OpenGarageApiModule(log)
        const openGarageApi = new OpenGarageApi({
            ip: config.ip,
            key: config.key,
            debug: debugEnabled
        })
        const moduleConfig = Object.assign({}, config, {debug: debugEnabled})
        const OpenGarage = OpenGarageModule(log, moduleConfig, {Service, Characteristic, openGarageApi, setTimeout, clearTimeout, Date})
        this.openGarage = new OpenGarage(config.name, true)
    }
    getServices() {
        return([
               this.openGarage.garageService,
               this.openGarage.vehicleService,
               ])
    }
}

module.exports = (api) => {
    Service = api.hap.Service
    Characteristic = api.hap.Characteristic
    api.registerAccessory("homebridge-og", "OpenGarage", OpenGarageConnect)
}
