import os from 'os'
import createRequest from './util/request'
import modules from './generatedModules.js'

// Helper function to get the IP address
const getIpAddress = () => {
    const interfaces = os.networkInterfaces()
    for (const nets of Object.values(interfaces)) {
        for (const net of nets) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address.startsWith('::ffff:') ? net.address.substr(7) : net.address
            }
        }
    }
    return 'IP address not found'
}

// Construct server function
export async function constructServer(route, moduleQuery) {
    const moduleDef = modules.find((item) => item.route === route)
    if (!moduleDef) {
        throw new Error('路由不存在')
    }
    const query = {
        cookie: moduleQuery.cookie,
        ...moduleQuery.query,
        ...moduleQuery.body,
        ...moduleQuery.files
    }
    const addClientIp = (...params) => {
        const [url, options, headers, extraData = {}] = params
        const ip = getIpAddress()
        return createRequest(url, options, headers, { ...extraData, ip })
    }

    try {
        return await moduleDef.module(query, addClientIp)
    } catch (error) {
        console.error('Error in constructServer:', error)
        return error
    }
}
