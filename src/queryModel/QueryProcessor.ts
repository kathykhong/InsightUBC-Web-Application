import {Section} from "../dataModel/Section";
import {InsightError} from "../controller/IInsightFacade";

export class QueryProcessor {
    public doFilter(section: Section, subquery: any, result: any[]) {
        switch (Object.keys(subquery)[0]) {
            case "LT": {
                this.filterLT(subquery, section, result);
                break;
            }
            case "GT": {
                this.filterGT(subquery, section, result);
                break;
            }
            case "EQ": {
                this.filterEQ(subquery, section, result);
                break;
            }
            case "IS": {
                this.filterIS(subquery, section, result);
                break;
            }
            case "AND": {
                let andResultArray: boolean[] = [];
                let andArgCount: number = subquery.AND.length;
                for (const arg of subquery.AND) {
                    this.doFilter(section, subquery, andResultArray);
                }
                if (andResultArray.length === andArgCount) {
                    result.push(section);
                }
                break;
            }
            case "OR": {
                let orResultArray: boolean[] = [];
                for (const arg of subquery.OR) {
                    this.doFilter(section, subquery, orResultArray);
                }
                if (orResultArray.length >= 1) {
                    result.push(section);
                }
                break;
            }
            /* case "NOT": {
                 let notResultArray: any[] = [];
                 this.doFilter(section, subquery.NOT, notResultArray);    }
                 break;
         }*/
        }
    }
    public filterIS(subquery: any, section: Section, result: any[]) {
        const operatorIS: string = Object.keys(subquery)[0];
        let idStringISarr: string[];
        let argKeyIS = Object.keys(subquery[operatorIS])[0];
        idStringISarr = argKeyIS.split("_");
        let idString: string = idStringISarr[0];
        let sfield: string = idStringISarr[1];
        let sValue: any = Object.values(subquery[operatorIS])[0];
        switch (sfield) {
            case "dept": {
                if (section.getDept() === sValue) {
                    result.push(section);
                }
                break;
            }
            case "id": {
                if (section.getPass() === sValue) {
                    result.push(section);
                }
                break;
            }
            case "instructor": {
                if (section.getFail() === sValue) {
                    result.push(section);
                }
                break;
            }
            case "title": {
                if (section.getAudit() === sValue) {
                    result.push(section);
                }
                break;
            }
            case "uuid": {
                if (section.getYear() === sValue) {
                    result.push(section);
                }
                break;
            }
        }

    }

    public filterLT(subquery: any, section: Section, result: any[]) {
        const operatorLT: string = Object.keys(subquery)[0];
        let idStringLTarr: string[];
        let argKeyLT = Object.keys(subquery[operatorLT])[0];
        idStringLTarr = argKeyLT.split("_");
        let idString: string = idStringLTarr[0];
        let mfield: string = idStringLTarr[1];
        let mValue: any = Object.values(subquery[operatorLT])[0];
        switch (mfield) {
            case "avg": {
                if (section.getAvg() < mValue) {
                    result.push(section);
                }
                break;
            }
            case "pass": {
                if (section.getPass() < mValue) {
                    result.push(section);
                }
                break;
            }
            case "fail": {
                if (section.getFail() < mValue) {
                    result.push(section);
                }
                break;
            }
            case "audit": {
                if (section.getAudit() < mValue) {
                    result.push(section);
                }
                break;
            }
            case "year": {
                if (section.getYear() < mValue) {
                    result.push(section);
                }
                break;
            }
        }
    }

    public filterGT(subquery: any, section: Section, result: any[]) {
        const operatorGT: string = Object.keys(subquery)[0];
        let idStringGTarr: string[];
        let argKeyGT = Object.keys(subquery[operatorGT])[0];
        idStringGTarr = argKeyGT.split("_");
        let idString: string = idStringGTarr[0];
        let mfield: string = idStringGTarr[1];
        let mValue: any = Object.values(subquery[operatorGT])[0];
        switch (mfield) {
            case "avg": {
                if (section.getAvg() > mValue) {
                    result.push(section);
                }
                break;
            }
            case "pass": {
                if (section.getPass() > mValue) {
                    result.push(section);
                }
                break;
            }
            case "fail": {
                if (section.getFail() > mValue) {
                    result.push(section);
                }
                break;
            }
            case "audit": {
                if (section.getAudit() > mValue) {
                    result.push(section);
                }
                break;
            }
            case "year": {
                if (section.getYear() > mValue) {
                    result.push(section);
                }
                break;
            }
        }
    }

    public filterEQ(subquery: any, section: Section, result: any[]) {
        const operatorEQ: string = Object.keys(subquery)[0];
        let idStringEQarr: string[];
        let argKeyEQ = Object.keys(subquery[operatorEQ])[0];
        idStringEQarr = argKeyEQ.split("_");
        let idString: string = idStringEQarr[0];
        let mfield: string = idStringEQarr[1];
        let mValue: any = Object.values(subquery[operatorEQ])[0];
        switch (mfield) {
            case "avg": {
                if (section.getAvg() === mValue) {
                    result.push(section);
                }
                break;
            }
            case "pass": {
                if (section.getPass() === mValue) {
                    result.push(section);
                }
                break;
            }
            case "fail": {
                if (section.getFail() === mValue) {
                    result.push(section);
                }
                break;
            }
            case "audit": {
                if (section.getAudit() === mValue) {
                    result.push(section);
                }
                break;
            }
            case "year": {
                if (section.getYear() === mValue) {
                    result.push(section);
                }
                break;
            }
        }
    }
}

