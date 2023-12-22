import express from 'express';
import dotenv from'dotenv'
dotenv.config();
import logger from './logger';
import { OrbwarsService } from './services/orbwars';
import { TomboAdventureService } from './services/tomboAdventure';

const INTERVAL = parseInt(<string>process.env.CHECK_INTERVAL, 10)

// load from env orbwars users
const WALLETS = process.env.WALLETS?.split(';') || []
const orbwarsServices = WALLETS.map(wallet => new OrbwarsService(wallet))

// load from env tombo adventure users
const TOMBO_ADVENTURE_USERS = process.env.TOMBO_ADVENTURE_USERS?.split(';') || []
const tomboAdventureServices = TOMBO_ADVENTURE_USERS.map(strUser => {
    if(strUser.split(':').length !== 2) {
        throw new Error('Invalid TOMBO_ADVENTURE_USERS format')
    }
    const { 0: walletId, 1: secret } = strUser.split(':')
    return new TomboAdventureService(walletId, secret)
})

setInterval(async () => {
    try {
        await Promise.all(orbwarsServices.map(service => service.do()))
        await Promise.all(tomboAdventureServices.map(service => service.do()))
    } catch (error) {
        logger.error('some service failed')
    }
}, INTERVAL)

const HOSTNAME = process.env.HOST || "0.0.0.0";
const PORT = parseInt(<string>process.env.PORT, 10) || 3000;

const app = express();

app.listen(PORT,HOSTNAME, () => {
    logger.info(`Server is running on port https://${HOSTNAME}:${PORT}/.`)
});