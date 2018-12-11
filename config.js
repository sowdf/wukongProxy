const config = {
    isDev: false,
    dev: {
        serverPort: 3838,
        host: 'http://www.39nat.com',
        serverHost: 'http://127.0.0.1:3838'
    },
    pro: {
        serverPort: 80,
        host: 'http://www.39nat.com',
        serverHost: 'http://service.39nat.com'
    }
}

module.exports = config.isDev ? config.dev : config.pro;