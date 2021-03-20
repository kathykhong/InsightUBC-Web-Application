import { InsightError } from "../controller/IInsightFacade";
import { OptionsValidator } from "./OptionsValidator";
import { WhereValidator } from "./WhereValidator";
import {TransformationsValidator} from "./TransformationsValidator";
export class QueryValidator {

    public  static sFields: string[] = ["dept", "id", "instructor", "title", "uuid",
        "fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];

    public static mFields: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    public static allFilters: string[] = ["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"];
    public static logicFilters: string[] = ["AND", "OR"];
    public static mCompareFilters: string[] = ["LT", "GT", "EQ"];
    public static sCompareFilters: string[] = ["IS"];
    public static applyTOKENS: string[] = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
    public columnIDString: string;
    public columnKeys: string[] = [];

    // first check if dataset is in our map, then check if dataset being queried has been added to data dir (disk)
    public validateQuery(query: any): void {
        if (Object.keys(query).length === 0) {
            throw new InsightError("Query is empty");
        }
        if (
            Object.keys(query).includes(null) ||
            Object.keys(query).includes(undefined)
        ) {
            throw new InsightError("Query cannot contain null or undefined");
        }
        if (
            Object.values(query).includes(null) ||
            Object.values(query).includes(undefined)
        ) {
            throw new InsightError("Query values cannot be null or undefined");
        }
        // check if query has at most 3 arguments
        if (Object.keys(query).length > 3 || Object.keys(query).length < 2) {
            throw new InsightError(
                "Query must contain WHERE and OPTIONS arguments",
            );
        }
        // check that query has only a WHERE and an OPTIONS
        this.containsWHEREandOPTIONSandTRANSFORMATIONS(query);
        let optionsValidator: OptionsValidator = new OptionsValidator();
        let whereValidator: WhereValidator = new WhereValidator();
        optionsValidator.validateOPTIONS(query, this);
        whereValidator.validateWHERE(query, this);
        if (Object.keys(query).length === 3) {
            TransformationsValidator.validateTRANSFORMATIONS(query);
        }
    }

    // check if WHERE keys are all valid
    // Object.keys(query[operator])[0]
    public containsWHEREandOPTIONSandTRANSFORMATIONS(query: any): void {
        if (!Object.keys(query).includes("WHERE")) {
            throw new InsightError("Query must contain a WHERE clause");
        }
        if (!Object.keys(query).includes("OPTIONS")) {
            throw new InsightError("Query must contain a OPTIONS clause");
        }
        if (Object.keys(query).length === 3) {
            if (!Object.keys(query).includes("TRANSFORMATIONS")) {
                throw new InsightError("Query may only additionally contain TRANSFORMATIONS");
            }
        }
        // if (
        //     (Object.keys(query)[0] === "WHERE"
        //         && Object.keys(query)[1] !== "OPTIONS")
        //     || (Object.keys(query)[0] === "OPTIONS"
        //     && Object.keys(query)[1] !== "WHERE")
        // ) {
        //     throw new InsightError("Keys must be WHERE or OPTIONS or TRANSFORMATIONS only");
        // }
    }

    public splitIDKey(idKey: string): string[] {
        return idKey.split("_");
    }

    public isValidIDStringOrApplyKey(ID: string): boolean {
        if (ID === null || ID === undefined) {
           return false;
        }
        if (ID.length < 1) {
            return false;
        }
        if (ID.includes("_")) {
            return false;
        }
        return true;
    }

    public isValidField(field: string, fieldType: string): boolean {
        if (fieldType === "all") {
            if (QueryValidator.sFields.includes(field) || QueryValidator.mFields.includes(field)) {
                return true;
            }
        } else if (fieldType === "sField") {
            if (QueryValidator.sFields.includes(field)) {
                return true;
            }
        } else if (fieldType === "mField") {
            if (QueryValidator.mFields.includes(field)) {
                return true;
            }
        } else {
            return false;
        }
    }

    public isValidANYKEY(field: string): boolean {
        if (this.isValidField(field, "all")) {
            return true;
        }
        if (this.isValidIDStringOrApplyKey(field)) {
            return true;
        }
        return false;
    }

    public static isValidAPPLYTOKEN(token: string): boolean {
        return (QueryValidator.applyTOKENS.includes(token));
    }
}
