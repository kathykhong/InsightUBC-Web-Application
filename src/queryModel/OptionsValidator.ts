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
            if (!Object.keys(query.OPTIONS).includes("COLUMNS")) {
                throw new InsightError("OPTIONS must contain COLUMNS");
            } else {
                this.validateCOLUMNS(query, queryValidator);
            }
        } else if (Object.keys(query.OPTIONS).length === 2) {
            // this.containsCOLUMNSandORDER(query);
            this.containsCOLUMNSandSORT(query);
            // must call validateCOLUMNS before validateORDER for global var to be set
            this.validateCOLUMNS(query, queryValidator);
            this.validateORDER(query, queryValidator);
            // this.validateORDER(query, queryValidator);
        }
    }

    private containsCOLUMNSandSORT(query: any) {
        if (Object.keys(query.OPTIONS).length > 2) {
            throw new InsightError("OPTIONS can contain maximum 2 keys");
        }
        if (Object.keys(query.OPTIONS).length === 0) {
            throw new InsightError("OPTIONS must contain at least 1 key");
        }
        if (Object.keys(query.OPTIONS).length === 1) {
            if (!Object.keys(query.OPTIONS).includes("COLUMNS")) {
                throw new InsightError("If OPTIONS has one key it must be COLUMNS");
            }
        }
        if (Object.keys(query.OPTIONS).length === 2) {
            if ((!Object.keys(query.OPTIONS).includes("COLUMNS")) || (!Object.keys(query.OPTIONS).includes("ORDER"))) {
                throw new InsightError("If OPTIONS has two keys it must include COLUMNS and ORDER");
            }
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
        for (const anykey of query.OPTIONS.COLUMNS) {
            let currIDKeyArr;
            let currID: string;
            let currKey: string;

            if (anykey.includes("_")) {
                currIDKeyArr = queryValidator.splitIDKey(anykey);
                currID = currIDKeyArr[0];
                currKey = currIDKeyArr[1];
                if (!queryValidator.isValidIDStringOrApplyKey(currID)) {
                    throw new InsightError("Invalid dataset id");
                }
                // check if all keys have the same id
                if (prevID === "" || prevID === currID) {
                    prevID = currID;
                } else {
                    throw new InsightError("all keys must have the same id");
                }
            } else {
                currKey = anykey;
            }
            // todo: if it is an applykey in columns, must check that it is defined in apply
            if (!queryValidator.isValidANYKEY(currKey)) {
                throw new InsightError("Invalid key");
            }
            queryValidator.columnKeys.push(anykey);
        }
        queryValidator.columnIDString = prevID;
    }

    public validateORDER(query: any, queryValidator: QueryValidator): void {
        if (Object.keys(query.OPTIONS.ORDER).includes(null) || Object.keys(query.OPTIONS.ORDER).includes(undefined)) {
            throw new InsightError("ORDER cannot contain NULL or undefined values");
        }
        if (Object.values(query.OPTIONS.ORDER).length === 0) {
            throw new InsightError("ORDER cannot have an empty value");
        }
        if (typeof query.OPTIONS.ORDER === "string") {
            if (Object.values(query.OPTIONS.ORDER).length > 1) {
                throw new InsightError("ORDER can only have one value (c1)");
            }
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
            if (!queryValidator.columnKeys.includes(currKey)) {
                throw new InsightError("ORDER key must be included in COLUMNS keys ");
            }
            // query.OPTIONS.ORDER is an object
        } else if (typeof query.OPTIONS.ORDER === "object") {
            if (Object.keys(query.OPTIONS.ORDER).length === 0) {
                throw new InsightError("ORDER's inner object must not be empty");
            }
            if (Object.keys(query.OPTIONS.ORDER).length !== 2) {
                throw new InsightError("ORDER's inner object must have 2 keys");
            }
            if ((!Object.keys(query.OPTIONS.ORDER).includes("dir")) ||
                !Object.keys(query.OPTIONS.ORDER).includes("keys")) {
                throw new InsightError("ORDER's inner objects must have dir and keys");
            }
            this.validateDir(query);
            this.validateKeys(query, queryValidator);
        } else {
            throw new InsightError("ORDER's value can only be an object or a string");
        }
    }

    /* checks that ANYKEY::= key | applykey */
    private validateANYKEY(query: any, queryValidator: QueryValidator) {
        // check if anykey is empty, null, undefined
        if (Object.values(query).includes(null) ||
        Object.values(query).includes(undefined)) {
            throw new InsightError("ANYKEY values cannot contain null or undefined values");
        }
        // check if anykey contains 1 value
        if (Object.values(query).length !== 1) {
            throw new InsightError("ANYKEY must only contain 1 value");
        }
        // check that the 1 value is a valid key or applykey
        // todo: validate by checking that keys are included in COLUMNS indicated keys
    }

    private validateDir(query: any) {
        if (query.OPTIONS.ORDER.dir === 0 || query.OPTIONS.ORDER.dir === null
            || query.OPTIONS.ORDER.dir === undefined) {
            throw new InsightError("ORDER's dir must not be empty, null, or undefined");
        }
        if (query.OPTIONS.ORDER.dir !== "UP" && query.OPTIONS.ORDER.dir !== "DOWN") {
            throw new InsightError("dir must be UP or DOWN");
        }
    }

    private validateKeys(query: any, queryValidator: QueryValidator) {
        if (query.OPTIONS.ORDER.keys === 0 || query.OPTIONS.ORDER.keys === null
            || query.OPTIONS.ORDER.keys === undefined) {
            throw new InsightError("ORDER's keys must not be empty, null, or undefined");
        }
        if (!Array.isArray(query.OPTIONS.ORDER.keys)) {
            throw new InsightError("ORDER's keys must be an array value");
        }
        if (query.OPTIONS.ORDER.keys.length === 0) {
            throw new InsightError("ORDER's keys array must not be empty");
        }
        for (const anykey of query.OPTIONS.ORDER.keys) {
            let currIDKeyArr;
            let currID: string;
            let currKey: string;

            if (anykey.includes("_")) {
                currIDKeyArr = queryValidator.splitIDKey(anykey);
                currID = currIDKeyArr[0];
                currKey = currIDKeyArr[1];
                if (!queryValidator.isValidIDStringOrApplyKey(currID)) {
                    throw new InsightError("Invalid dataset id");
                }
            } else {
                currKey = anykey;
            }
            if (!queryValidator.columnKeys.includes(currKey)) {
                throw new InsightError("ORDER's keys keys (LOL) must be present in COLUMNS keys");
            }
        }
    }
}
