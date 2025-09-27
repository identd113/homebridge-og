const request = require("request-promise-native")

function OpenGarageApiModule(log, deps = {}) {
    const requestClient = deps.request || request
    class OpenGarageApi{
        constructor({ip, key}) {
            this.key = key
            this.ip = ip
            this.baseUrl = "http://" + ip
        }

        urlFor(path, params) {
            let url = this.baseUrl + path + "?dkey=" + this.key
            if (params)
                url = url + "&" + params
            return url
        }


        getState() {
            return requestClient.get({ url: this.urlFor("/jc") }).then(
                (body) => JSON.parse(body),
                (err) => {
                    log("Error getting state:", err.message)
                    let timeout = err && (err.code === "ETIMEDOUT" || (err.cause && err.cause.code === "ETIMEDOUT"))
                    if (timeout) {
                        const warn = typeof log.warn === "function" ? log.warn.bind(log) : log
                        warn("Host may be down, IP:%s", this.ip)
                    }
                    throw err
                })
        }

        _handleResponse(body) {
            let responseCode = JSON.parse(body).result
            switch(responseCode) {
            case 1: return true
            case 2: throw new Error("Not authorized")
            case 3: throw new Error("Mismatch")
            case 16: throw new Error("Data missing")
            case 17: throw new Error("Out of range")
            case 18: throw new Error("Data Format Error")
            case 32: throw new Error("Page Not Found")
            case 48: throw new Error("Not Permitted")
            case 64: throw new Error("Upload Failed")
            default:
                throw new Error("Unrecognized response code: " + responseCode)
            }
        }

        setTargetState(closed) {
            let url = this.urlFor(
                "/cc",
                closed ? "close=1" : "open=1")
            log(url)
            return requestClient.get({url}).then((body) => this._handleResponse(body))
        }
    }

    return OpenGarageApi
}
module.exports = OpenGarageApiModule
