const assert = require('assert')
const util = require('util')
const OpenGarageApiModule = require('../lib/open_garage_api.js')

describe('OpenGarageApi', function() {
    it('logs a warning when requests time out', async function() {
        const logs = []
        const warns = []
        function log() {
            logs.push(util.format.apply(util, arguments))
        }
        log.warn = function() {
            warns.push(util.format.apply(util, arguments))
        }

        const request = {
            get: () => Promise.reject(Object.assign(new Error('read ETIMEDOUT'), {code: 'ETIMEDOUT'}))
        }

        const OpenGarageApi = OpenGarageApiModule(log, {request})
        const api = new OpenGarageApi({ip: '10.0.0.1', key: 'secret'})

        await assert.rejects(() => api.getState())

        assert(logs.some((message) => message.includes('Error getting state: read ETIMEDOUT')))
        assert(warns.some((message) => message.includes('Host may be down, IP:10.0.0.1')))
    })

    it('falls back to info logging when warn is unavailable', async function() {
        const infoLogs = []
        function log() {
            infoLogs.push(util.format.apply(util, arguments))
        }

        const request = {
            get: () => Promise.reject(Object.assign(new Error('read ETIMEDOUT'), {code: 'ETIMEDOUT'}))
        }

        const OpenGarageApi = OpenGarageApiModule(log, {request})
        const api = new OpenGarageApi({ip: '10.0.0.2', key: 'secret'})

        await assert.rejects(() => api.getState())

        const fallbackMessage = infoLogs.filter((message) => message.includes('Host may be down, IP:10.0.0.2'))
        assert.equal(fallbackMessage.length, 1)
    })

    it('logs additional details when debug is enabled', async function() {
        const debugLogs = []
        function log() {}
        log.debug = function() {
            debugLogs.push(util.format.apply(util, arguments))
        }

        const request = {
            get: ({url}) => {
                if (url.includes('/jc'))
                    return Promise.resolve(JSON.stringify({door: 0}))

                return Promise.resolve(JSON.stringify({result: 1}))
            }
        }

        const OpenGarageApi = OpenGarageApiModule(log, {request})
        const api = new OpenGarageApi({ip: '10.0.0.3', key: 'secret', debug: true})

        await api.getState()
        await api.setTargetState(true)

        assert(debugLogs.some((message) => message.includes('GET http://10.0.0.3/jc')))
        assert(debugLogs.some((message) => message.includes('dkey=***')))
    })
})
