import winston from 'winston'

const format = winston.format.cli()
const logger = winston.createLogger({
    level: 'info',
    format: format,
    defaultMeta: {
        app: 'nft-ternoa-bot'
    },
    transports: [
        new winston.transports.Console()
    ]
})

export default logger