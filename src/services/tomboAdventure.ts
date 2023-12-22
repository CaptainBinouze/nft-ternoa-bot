import logger from "../logger";

const baseUrl = "https://tombo-api.ternoa.dev/api";

const TIME_BETWEEN_CLAIMS = 4 * 60 * 60 * 1000;

export class TomboAdventureService {

    private token: string = "";
    private secret: string = "";
    private walletId: string = "";
    private nextClaim: Date = new Date();
    private lastRefresh: Date = new Date();

    constructor(walletId: string, secret: string) {
        if (walletId === undefined || walletId === "" || secret === undefined || secret === "") {
            throw new Error("walletId and secret are required");
        }
        this.walletId = walletId;
        this.secret = secret;
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
                await this.user();
            }
            if(this.canClaim()) {
                await this.claim();
                await this.user();
            } else {
                let minutes = Math.trunc((this.nextClaim.getTime() - new Date().getTime()) / 1000 / 60);
                if(minutes % 60 === 0 && minutes > 0) {
                    logger.info(`TomboAdventureService.do: next claim in ${minutes} minutes for wallet ${this.walletId}`);
                }
            }
        } catch (error) {
            logger.error(`TomboAdventureService.do: ${error}`);
            this.setToken("");
        }
    }

    public async login() {
        logger.debug("TomboAdventureService.login")
        try {
            const response = await fetch(`${baseUrl}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    walletId: this.walletId,
                    phoneOTP: this.secret
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.jwt);
                logger.info(`TomboAdventureService.login: token set for wallet ${this.walletId}`);
                return data;
            } else {
                logger.error(`TomboAdventureService.login: request failed with status ${response.status}`);
                this.setToken("");
                throw new Error(response.statusText);
            }
        } catch (error) {
            logger.error(`TomboAdventureService.login: ${error}`);
            this.setToken("");
            throw error;
        }
    }

    public async user() {
        logger.debug("TomboAdventureService.user")
        try {
            if (this.getToken() === "") {
                await this.login();
            }
            const response = await fetch(`${baseUrl}/user/get`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.getToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if(data.additionalData) {
                    let lastClaim = new Date(data.additionalData.lastGatchaClaimTimeStamp)
                    this.nextClaim = new Date(lastClaim.getTime() + TIME_BETWEEN_CLAIMS);
                    logger.info(`TomboAdventureService.user: next claim in ${Math.trunc((this.nextClaim.getTime() - new Date().getTime()) / 1000 / 60)} minutes for wallet ${this.walletId}`);
                    this.lastRefresh = new Date();
                }
            } else {
                logger.error(`TomboAdventureService.user: request failed with status ${response.status}`);
                throw new Error(response.statusText);
            }

        } catch (error) {
            logger.error(`TomboAdventureService.user: ${error}`);
            throw error;
        }
    }

    public async claim() {
        logger.debug("TomboAdventureService.claim")
        try {
            const response = await fetch(`${baseUrl}/user/claimGatcha`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.getToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if(data.status === "Success") {
                    logger.info(`TomboAdventureService.claim: gatcha claimed for wallet ${this.walletId}`);
                }
            } else {
                logger.error(`TomboAdventureService.claim: request failed with status ${response.status} - resetting token`);
                this.setToken("");
            }

        } catch (error) {
            logger.error(`TomboAdventureService.claim: ${error}`);
            throw error;
        }
    }
}