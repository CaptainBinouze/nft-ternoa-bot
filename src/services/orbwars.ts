import logger from "../logger";

const baseUrl = "https://api.theorbwars.com";

const TIME_BETWEEN_CLAIMS = 4 * 60 * 60 * 1000;

export class OrbwarsService {
    
    private token: string = "";
    private walletId: string = "";
    private nextClaim: Date = new Date();
    private lastRefresh: Date = new Date();

    constructor(walletId: string) {
        this.walletId = walletId;
    }

    private setToken(token: string) {
        this.token = token;
    }

    private getToken() {
        return this.token;
    }

    public canClaim(): boolean {
        return this.nextClaim < new Date() || this.lastRefresh < new Date(Date.now() - TIME_BETWEEN_CLAIMS);
    }

    public async do() {
        try {
            if(this.getToken() === "") {
                await this.me();
            }
            if(this.canClaim()) {
                await this.claim();
            } else {
                let minutes = Math.trunc((this.nextClaim.getTime() - new Date().getTime()) / 1000 / 60);
                if(minutes % 60 === 0 && minutes > 0) {
                    logger.info(`OrbwarsService.do: next claim in ${minutes} minutes for wallet ${this.walletId}`);
                }
            }
        } catch (error) {
            logger.error(`OrbwarsService.do: ${error}`);
            this.setToken("");
        }
    }

    public async login() {
        logger.debug("OrbwarsService.login")
        try {
            const response = await fetch(`${baseUrl}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    walletId: this.walletId
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.jwt);
                logger.info(`OrbwarsService.login: token set for wallet ${this.walletId}`);
                return data;
            } else {
                logger.error(`OrbwarsService.login: request failed with status ${response.status}`);
                this.setToken("");
                throw new Error(response.statusText);
            }
        } catch (error) {
            logger.error(`OrbwarsService.login: ${error}`);
            this.setToken("");
            throw error;
        }
    }

    public async me() {
        logger.debug("OrbwarsService.me")
        try {
            if (this.getToken() === "") {
                await this.login();
            }
            const response = await fetch(`${baseUrl}/me`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.getToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if(data.nextTicketAt) {
                    this.nextClaim = new Date(data.nextTicketAt);
                    logger.info(`OrbwarsService.me: next claim in ${Math.trunc((this.nextClaim.getTime() - new Date().getTime()) / 1000 / 60)} minutes for wallet ${this.walletId}`);
                    this.lastRefresh = new Date();
                }
            } else {
                logger.error(`OrbwarsService.me: request failed with status ${response.status}`);
                throw new Error(response.statusText);
            }

        } catch (error) {
            logger.error(`OrbwarsService.me: ${error}`);
            throw error;
        }
    }

    public async claim() {
        logger.debug("OrbwarsService.claim")
        try {
            const response = await fetch(`${baseUrl}/tickets/claim`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.getToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if(data.ticket && data.ticket.claimedAt) {
                    logger.info(`OrbwarsService.claim: ${data.ticket.quantity} tickets claimed for wallet ${this.walletId}`);
                    this.nextClaim = new Date(new Date(data.ticket.claimedAt).getTime() + TIME_BETWEEN_CLAIMS);
                    this.lastRefresh = new Date();
                }
            } else {
                logger.error(`OrbwarsService.claim: request failed with status ${response.status} - resetting token`);
                this.setToken("");
            }

        } catch (error) {
            logger.error(`OrbwarsService.claim: ${error}`);
            throw error;
        }
    }

}