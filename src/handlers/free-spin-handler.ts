import { FreeSpin } from "../models/free-spin";

export class FreeSpinHandler {
    private freeSpins: FreeSpin;
    private totalMultiplier: number;

    constructor() {
        this.freeSpins = { available: 0, coinValue: 0, betLevel: 0 };
        this.totalMultiplier = 0;
    }

    getFreeSpinData() {
        return this.freeSpins;
    }

    useFreeSpin() {
        if (this.freeSpins.available) {
            this.freeSpins.available--;

            !this.freeSpins.available && this.resetTotalMultiplier();
        }
    }

    gainFreeSpins(freeSpin: FreeSpin) {
        if (this.freeSpins.available) {
            this.freeSpins.available += freeSpin.available;
        } else {
            this.freeSpins = { ...freeSpin };
        }
    }

    getAvailableFreeSpins() {
        return this.freeSpins.available;
    }

    resetTotalMultiplier() {
        this.totalMultiplier = 0;
    }

    increaseTotalMultiplier(multiplier: number) {
        this.totalMultiplier += multiplier;
    }

    getCurrentTotalMultiplier() {
        return this.totalMultiplier;
    }
}
