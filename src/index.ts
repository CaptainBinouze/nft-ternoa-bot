import express from 'express';
import dotenv from'dotenv'
dotenv.config();
import logger from './logger';
import { OrbwarsService } from './services/orbwars';

const INTERVAL = parseInt(<string>process.env.CHECK_INTERVAL, 10)
const WALLETS = process.env.WALLETS?.split(';') || []

const orbwarsServices = WALLETS.map(wallet => new OrbwarsService(wallet))

setInterval(async () => {
    try {
        await Promise.all(orbwarsServices.map(service => service.do()))
    } catch (error) {
        logger.error('OrbwarsService failed')
    }
}, INTERVAL * 2)

const HOSTNAME = process.env.HOST || "0.0.0.0";
const PORT = parseInt(<string>process.env.PORT, 10) || 3000;

const app = express();

app.listen(PORT,HOSTNAME, () => {
    logger.info(`Server is running on port https://${HOSTNAME}:${PORT}/.`)
});