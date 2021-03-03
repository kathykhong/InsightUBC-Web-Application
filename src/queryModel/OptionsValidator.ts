import { InsightError } from "../controller/IInsightFacade";
import { QueryValidator } from "./QueryValidator";

// TODO: can OPTIONS contain multiple COLUMNS, and multiple ORDERS
// TODO: can OPTIONS contain multiple COLUMNS, and no ORDERS

export class OptionsValidator {
    public validateOPTIONS(query: any, queryValidator: QueryValidator): void {
        // may be redundant if caller is checking
        if (!Object.keys(query).includes("OPTIONS")) {
            throw new InsightError("Query must contain valid OPTIONS");
        }
        // check if OPTIONS contains null or undefined values
        if (
            Object.keys(query.OPTIONS).includes(null) ||
            Object.keys(query.OPTIONS).includes(undefined)
        ) {
            throw new InsightError("OPTIONS cannot contain null or undefined");
        }
        if (
            Object.values(query.OPTIONS).includes(null) ||
            Object.values(query.OPTIONS).includes(undefined)
        ) {
            throw new InsightError(
                "OPTIONS values cannot be null or undefined",
            );
        }
        // check if OPTIONS clause exists but is empty
        if (Object.keys(query.OPTIONS).length === 0) {
            throw new InsightError("Query must contain non-empty OPTIONS");
        }
        // check validity of COLUMNS and ORDER
        if (Object.keys(query.OPTIONS).length === 1) {
            // check that OPTIONS contains COLUMNS
            if (Object.keys(query.OPTIONS)[0] !== "COLUMNS") {
                throw new InsightError("OPTIONS must contain COLUMNS");
            } else {
                this.validateCOLUMNS(query, queryValidator);
            }
        } else if (Object.keys(query.OPTIONS).length === 2) {
            this.containsCOLUMNSandORDER(query);
            // must call validateCOLUMNS before validateORDER for global var to be set
            this.validateCOLUMNS(query, queryValidator);
            this.validateORDER(query, queryValidator);
        }
    }

    // REQUIRES: caller to check that Object.keys(query.OPTIONS).length === 2
    public containsCOLUMNSandORDER(query: any): void {
        // faulty logic causing debugger to throw an error right away
        /* if (Object.keys(query.OPTIONS)[0] !== "COLUMNS" || Object.keys(query.OPTIONS)[0] !== "ORDER") {
             throw new InsightError("Keys must be COLUMNS or ORDER only");
         }

         if (Object.keys(query.OPTIONS)[1] !== "COLUMNS" || Object.keys(query.OPTIONS)[1] !== "ORDER") {
             throw new InsightError("Keys must be COLUMNS or ORDER only");
         }*/

        // instead
        if (!Object.keys(query.OPTIONS).includes("COLUMNS")) {
            throw new InsightError("Options must contain columns");
        }
        if (!Object.keys(query.OPTIONS).includes("ORDER")) {
            throw new InsightError("Options with length 2 must contain order");
        }
        if (
            (Object.keys(query.OPTIONS)[0] === "COLUMNS" &&
                Object.keys(query.OPTIONS)[1] !== "ORDER") ||
            (Object.keys(query.OPTIONS)[0] === "ORDER" &&
                Object.keys(query.OPTIONS)[1] !== "COLUMNS")
        ) {
            throw new InsightError("Keys must be COLUMNS or ORDER only");
        }
    }

    public validateCOLUMNS(query: any, queryValidator: QueryValidator): void {
        // check if OPTIONS contains null or undefined values
        // missed the not here
        if (!Array.isArray(query.OPTIONS.COLUMNS)) {
            throw new InsightError("COLUMNS' value must be an array");
        }

        if (
            query.OPTIONS.COLUMNS.includes(null) ||
            query.OPTIONS.COLUMNS.includes(undefined)
        ) {
            throw new InsightError(
                "COLUMNS' array cannot contain null or undefined",
            );
        }
        // check that COLUMNS has at least one key
        if (query.OPTIONS.COLUMNS.length < 1) {
            throw new InsightError("COLUMNS must contain at least one key");
        }

        // check the validity of each key inside COLUMNS
        // for each id_key in columns, split, and check that the key element is one of the valid mkeys or skeys
        let prevID: string = "";
        for (const key of query.OPTIONS.COLUMNS) {
            let currIDKeyArr = queryValidator.splitIDKey(key);
            let currID: string = currIDKeyArr[0];
            let currKey: string = currIDKeyArr[1];
            if (!queryValidator.isValidField(currKey, "all")) {
                throw new InsightError("Invalid key");
            }
            queryValidator.columnFields.push(currKey);
            // added a not here
            if (!queryValidator.isValidIDString(currID)) {
                throw new InsightError("Invalid course id");
            }
            // check if all keys have the same id
            if (prevID === "" || prevID === currID) {
                prevID = currID;
            } else {
                throw new InsightError("all keys must have the same id");
            }
        }
        queryValidator.columnIDString = prevID;
    }

    public validateORDER(query: any, queryValidator: QueryValidator): void {
        // if OPTIONS contains a second OPTION, check that it is ORDER
        // Check if OPTIONS contains ORDER (optional clause)
        // maybe take the following out (in case we can't guarantee the checking at the caller level)
        if (Object.keys(query.OPTIONS).length < 2) {
            throw new InsightError("COLUMNS can only contain one clause");
        }
        // when OPTIONS contains ORDER, check that OPTIONS only has one ORDER
        if (!Object.keys(query.OPTIONS).includes("ORDER")) {
            throw new InsightError("OPTIONS must contain one or no ORDER");
        }
        if (!Object.keys(query.OPTIONS).includes("COLUMNS")) {
            throw new InsightError("OPTIONS must contain one COLUMNS");
        }
        // when OPTIONS contains ORDER, check that OPTIONS only has one ORDER
        // todo: maybe redundant if caller is also checking but who'sssss responsibility?????
        // if (!this.containsCOLUMNSandORDER(query)) {
        //     return Promise.reject(new InsightError("OPTIONS must have one or no ORDER"));
        // }
        // check if ORDER has one value only
        if (typeof query.OPTIONS.ORDER !== "string") {
            throw new InsightError("ORDER can only contain one string value");
        }
        // check if ORDER's (singular) key is valid skey or mkey
        let currIDKeyArr = queryValidator.splitIDKey(query.OPTIONS.ORDER);
        let currID: string = currIDKeyArr[0];
        let currKey: string = currIDKeyArr[1];
        if (!queryValidator.isValidField(currKey, "all")) {
            throw new InsightError("Invalid key");
        }
        if (queryValidator.columnIDString !== currID) {
            throw new InsightError(
                "Dataset ID must match all other dataset IDs in this query",
            );
        }
        // check if ORDER's (singular) key is included in COLUMNS
        // added a not here
        if (!queryValidator.columnFields.includes(currKey)) {
            throw new InsightError(
                "ORDER key must be included in COLUMNS keys ",
            );
        }
    }
}
