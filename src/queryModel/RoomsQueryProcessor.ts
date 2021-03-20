import {Room} from "../dataModel/Room";

export class RoomsQueryProcessor {
    public checkFilterCondMet(room: Room, subquery: any): boolean {
        switch (Object.keys(subquery)[0]) {
            case "LT": {
                return this.filterLT(subquery, room);
            }
            case "GT": {
                return this.filterGT(subquery, room);
            }
            case "EQ": {
                return this.filterEQ(subquery, room);
            }
            case "IS": {
                return this.filterIS(subquery, room);
            }
            case "AND": {
                let andResultBoolean: boolean = true;
                for (const arg of subquery.AND) {
                    if (!this.checkFilterCondMet(room, arg)) {
                        andResultBoolean = false;
                    }
                }
                return andResultBoolean;
            }
            case "OR": {
                let orResultBoolean: boolean = false;
                for (const arg of subquery.OR) {
                    if (this.checkFilterCondMet(room, arg)) {
                        orResultBoolean = true;
                    }
                }
                return orResultBoolean;
            }
            case "NOT": {
                let notResultBoolean: boolean = true;
                if (this.checkFilterCondMet(room, subquery.NOT)) {
                    notResultBoolean = false;
                }
                return notResultBoolean;
            }
        }
    }

    public filterIS(subquery: any, room: Room): boolean {
        const operatorIS: string = Object.keys(subquery)[0];
        let idStringISarr: string[];
        let argKeyIS = Object.keys(subquery[operatorIS])[0];
        idStringISarr = argKeyIS.split("_");
        let sfield: string = idStringISarr[1];
        let sValue: any = Object.values(subquery[operatorIS])[0];
        switch (sfield) {
            case "fullname": {
                return this.checkWildCards(room.getFullname(), sValue);
            }
            case "shortname": {
                return this.checkWildCards(room.getShortname(), sValue);
            }
            case "number": {
                return this.checkWildCards(room.getNumber(), sValue);
            }
            case "name": {
                return this.checkWildCards(room.getName(), sValue);
            }
            case "address": {
                return this.checkWildCards(room.getAddress(), sValue);
            }
            case "type": {
                return this.checkWildCards(room.getType(), sValue);
            }
            case "furniture": {
                return this.checkWildCards(room.getFurniture(), sValue);
            }
            case "href": {
                return this.checkWildCards(room.getLink(), sValue);
            }
        }
    }

    private checkWildCards(sfield: string, sValue: string): boolean {
        let sValueArr = sValue.split("*");
        if (sValue.startsWith("*") && sValue.endsWith("*")) {
            return sfield.includes(sValueArr[1]);
        }
        if (sValue.startsWith("*") && !sValue.endsWith("*")) {
            return sfield.endsWith(sValueArr[1]);
        }

        if (!sValue.startsWith("*") && sValue.endsWith("*")) {
            return sfield.startsWith(sValueArr[0]);
        }
        if (!sValue.includes("*")) {
            return sfield === sValue;
        }
    }

    private filterLT(subquery: any, room: Room): boolean {
        const operatorLT: string = Object.keys(subquery)[0];
        let idStringLTarr: string[];
        let argKeyLT = Object.keys(subquery[operatorLT])[0];
        idStringLTarr = argKeyLT.split("_");
        let mfield: string = idStringLTarr[1];
        let mValue: any = Object.values(subquery[operatorLT])[0];
        switch (mfield) {
            case "lat": {
                return room.getLat() < mValue;
            }
            case "lon": {
                return room.getLon() < mValue;
            }
            case "seats": {
                return room.getSeats() < mValue;
            }
        }
    }

    public filterGT(subquery: any, room: Room): boolean {
        const operatorGT: string = Object.keys(subquery)[0];
        let idStringGTarr: string[];
        let argKeyGT = Object.keys(subquery[operatorGT])[0];
        idStringGTarr = argKeyGT.split("_");
        let mfield: string = idStringGTarr[1];
        let mValue: any = Object.values(subquery[operatorGT])[0];
        switch (mfield) {
            case "lat": {
                return room.getLat() > mValue;
            }
            case "lon": {
                return room.getLon() > mValue;
            }
            case "seats": {
                return room.getSeats() > mValue;
            }
        }
    }

    public filterEQ(subquery: any, room: Room): boolean {
        const operatorEQ: string = Object.keys(subquery)[0];
        let idStringEQarr: string[];
        let argKeyEQ = Object.keys(subquery[operatorEQ])[0];
        idStringEQarr = argKeyEQ.split("_");
        let mfield: string = idStringEQarr[1];
        let mValue: any = Object.values(subquery[operatorEQ])[0];
        switch (mfield) {
            case "lat": {
                return room.getLat() === mValue;
            }
            case "lon": {
                return room.getLon() === mValue;
            }
            case "seats": {
                return room.getSeats() === mValue;
            }
        }
    }
}
