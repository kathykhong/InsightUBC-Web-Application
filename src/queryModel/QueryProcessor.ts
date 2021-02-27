import {Section} from "../dataModel/Section";
import {InsightError} from "../controller/IInsightFacade";

export class QueryProcessor {
    public checkFilterCondMet(section: Section, subquery: any): boolean {
        switch (Object.keys(subquery)[0]) {
            case "LT": {
                return this.filterLT(subquery, section);
            }
            case "GT": {
                return this.filterGT(subquery, section);
            }
            case "EQ": {
                return this.filterEQ(subquery, section);
            }
            case "IS": {
                return this.filterIS(subquery, section);
            }
            case "AND": {
                let andResultBoolean: boolean = true;
                for (const arg of subquery.AND) {
                    if (!this.checkFilterCondMet(section, arg)) {
                        andResultBoolean = false;
                    }
                }
                return andResultBoolean;
            }
            case "OR": {
                let orResultBoolean: boolean = false;
                for (const arg of subquery.OR) {
                    if (this.checkFilterCondMet(section, arg)) {
                        orResultBoolean = true;
                    }
                }
                return orResultBoolean;
            }
            case "NOT": {
                let notResultBoolean: boolean = true;
                if (this.checkFilterCondMet(section, subquery.NOT)) {
                    notResultBoolean = false;
                }
                return notResultBoolean;
            }
            default:
                return false;
        }
    }
    public filterIS(subquery: any, section: Section): boolean {
        const operatorIS: string = Object.keys(subquery)[0];
        let idStringISarr: string[];
        let argKeyIS = Object.keys(subquery[operatorIS])[0];
        idStringISarr = argKeyIS.split("_");
        let idString: string = idStringISarr[0];
        let sfield: string = idStringISarr[1];
        let sValue: any = Object.values(subquery[operatorIS])[0];
        switch (sfield) {
            case "dept": {
                return section.getDept() === sValue;
            }
            case "id": {
                return section.getPass() === sValue;
            }
            case "instructor": {
                return section.getFail() === sValue;
            }
            case "title": {
                return section.getAudit() === sValue;
            }
            case "uuid": {
                return section.getYear() === sValue;
            }
            default:
                return false;
        }

    }

    public filterLT(subquery: any, section: Section): boolean {
        const operatorLT: string = Object.keys(subquery)[0];
        let idStringLTarr: string[];
        let argKeyLT = Object.keys(subquery[operatorLT])[0];
        idStringLTarr = argKeyLT.split("_");
        let idString: string = idStringLTarr[0];
        let mfield: string = idStringLTarr[1];
        let mValue: any = Object.values(subquery[operatorLT])[0];
        switch (mfield) {
            case "avg": {
                return section.getAvg() < mValue;
            }
            case "pass": {
                return section.getPass() < mValue;
            }
            case "fail": {
                return section.getFail() < mValue;
            }
            case "audit": {
                return section.getAudit() < mValue;
            }
            case "year": {
                return section.getYear() < mValue;
            }
            default:
                return false;
        }
    }

    public filterGT(subquery: any, section: Section): boolean {
        const operatorGT: string = Object.keys(subquery)[0];
        let idStringGTarr: string[];
        let argKeyGT = Object.keys(subquery[operatorGT])[0];
        idStringGTarr = argKeyGT.split("_");
        let idString: string = idStringGTarr[0];
        let mfield: string = idStringGTarr[1];
        let mValue: any = Object.values(subquery[operatorGT])[0];
        switch (mfield) {
            case "avg": {
                return section.getAvg() > mValue;
            }
            case "pass": {
                return section.getPass() > mValue;
            }
            case "fail": {
                return section.getFail() > mValue;
            }
            case "audit": {
                return section.getAudit() > mValue;
            }
            case "year": {
                return section.getYear() > mValue;
            }
            default:
                return false;
        }
    }


    public filterEQ(subquery: any, section: Section): boolean {
        const operatorEQ: string = Object.keys(subquery)[0];
        let idStringEQarr: string[];
        let argKeyEQ = Object.keys(subquery[operatorEQ])[0];
        idStringEQarr = argKeyEQ.split("_");
        let idString: string = idStringEQarr[0];
        let mfield: string = idStringEQarr[1];
        let mValue: any = Object.values(subquery[operatorEQ])[0];
        switch (mfield) {
            case "avg": {
                return section.getAvg() === mValue;
                break;
            }
            case "pass": {
                return section.getPass() === mValue;
                break;
            }
            case "fail": {
                return section.getFail() === mValue;
            }
            case "audit": {
                return section.getAudit() === mValue;
                break;
            }
            case "year": {
                return section.getYear() === mValue;
                break;
            }
            default:
                return false;
        }
    }
}

