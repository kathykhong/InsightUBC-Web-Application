import {InsightError} from "../controller/IInsightFacade";
import Decimal from "decimal.js";

export class AnykeyHandler {
    public static doApply(group: any[], applyKey: string, applyToken: string, mskey: string) {
        switch (applyToken) {
            case "MAX": {
                AnykeyHandler.applyTokenMAX(group, applyKey, mskey);
                break;
            }
            case "MIN": {
                AnykeyHandler.applyTokenMIN(group, applyKey, mskey);
                break;
            }

            case "AVG": {
                AnykeyHandler.applyTokenAVG(group, applyKey, mskey);
                break;
            }

            case "COUNT": {
                AnykeyHandler.applyTokenCOUNT(group, applyKey, mskey);
                break;
            }

            case "SUM": {
                AnykeyHandler.applyTokenSUM(group, applyKey, mskey);
                break;
            }
            default: {
                throw new InsightError("idk something wrong bruh");
            }
        }
    }

    public static applyTokenMAX(group: any[], applykey: string, mskey: string) {
        let currMax: number = Number.MIN_SAFE_INTEGER;
        for (const section of group) {
            let sectionField: number = section.getArg(mskey);
            if (sectionField > currMax) {
                currMax = sectionField;
            }
        }
        for (const section of group) {
            section.applyKeyStorage[applykey] = currMax;
        }
    }

    public static applyTokenMIN(group: any[], applykey: string, mskey: string) {
        let currMin: number = Number.MAX_SAFE_INTEGER;
        for (const section of group) {
            let sectionField: number = section.getArg(mskey);
            if (sectionField < currMin) {
                currMin = sectionField;
            }
        }
        for (const section of group) {
            section.applyKeyStorage[applykey] = currMin;
        }
    }

    public static applyTokenSUM(group: any[], applykey: string, mskey: string) {
        let currSum: number = 0;
        for (const section of group) {
            let sectionField: number = section.getArg(mskey);
            currSum += sectionField;
        }
        for (const section of group) {
            section.applyKeyStorage[applykey] = Number(currSum.toFixed(2));
        }
    }

    public static applyTokenAVG(group: any[], applykey: string, mskey: string) {
        let currTotal: any = new Decimal(0);
        let count: number = 0;
        for (const section of group) {
            let sectionField: any = section.getArg(mskey);
            sectionField = new Decimal(sectionField);
            currTotal = Decimal.add(currTotal, sectionField);
            count += 1;
        }
        let avg: number = 0;
        let res: number = 0;
        if (count !== 0) {
            avg = currTotal.toNumber() / count;
        } else {
            avg = 0;
        }
        res = Number(avg.toFixed(2));
        for (const section of group) {
            section.applyKeyStorage[applykey] = res;
        }
    }

    public static applyTokenCOUNT(group: any[], applykey: string, mskey: string) {
        let uniqueVals: Map<string, number> = new Map();
        for (const section of group) {
            // elisa: 3, norm: 4 => 2
            let msval = section.getArg(mskey);
            if (!uniqueVals.has(msval)) {
                uniqueVals.set(msval, 1);
            }
        }
        for (const section of group) {
            section.applyKeyStorage[applykey] = uniqueVals.size;
        }
    }
}
