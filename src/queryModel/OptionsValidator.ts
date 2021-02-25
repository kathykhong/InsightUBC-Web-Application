import {InsightError} from "../controller/IInsightFacade";
import {QueryValidator} from "./QueryValidator";

export class OptionsValidator {
    public validateOPTIONS(query: any, queryValidator: QueryValidator): Promise<any> {
        // check if OPTIONS contains null or undefined values
        if (Object.keys(query).includes(null) || Object.keys(query).includes(undefined)) {
            return Promise.reject(new InsightError("OPTIONS cannot contain null or undefined"));
        }
        if (Object.values(query).includes(null) || Object.values(query).includes(undefined)) {
            return Promise.reject(new InsightError("OPTIONS values cannot be null or undefined"));
        }
        // may be redundant if caller is checking
        if (!Object.keys(query).includes("OPTIONS")) {
            return Promise.reject(new InsightError("Query must contain valid OPTIONS"));
        }
        // check if OPTIONS clause exists but is empty
        if (query.OPTIONS.length === 0) {
            return Promise.reject(new InsightError("Query must contain non-empty OPTIONS"));
        }
        // check validity of COLUMNS and ORDER
        if (Object.keys(query.OPTIONS).length === 1) {
            this.validateCOLUMNS(query, queryValidator);
        } else if (Object.keys(query.OPTIONS).length === 2) {
            if (!this.containsCOLUMNSandORDER(query)) {
                return Promise.reject(new InsightError("If OPTIONS body has 2 arguments, they must" +
                    "be COLUMNS and ORDER"));
            } else {
                // must call validateCOLUMNS before validateORDER for global var to be set
                this.validateCOLUMNS(query, queryValidator);
                this.validateORDER(query, queryValidator);
            }
        } else {
            return Promise.reject(new InsightError("OPTIONS must have one or two clauses"));
        }
    }

    // REQUIRES: caller to check that Object.keys(query.OPTIONS).length === 2
    public containsCOLUMNSandORDER(query: any): Promise<any> {
        if (Object.keys(query.OPTIONS)[0] !== "COLUMNS" || Object.keys(query.OPTIONS)[0] !== "ORDER") {
            return Promise.reject(new InsightError("Keys must be COLUMNS or ORDER only"));
        }

        if (Object.keys(query.OPTIONS)[1] !== "COLUMNS" || Object.keys(query.OPTIONS)[1] !== "ORDER") {
            return Promise.reject(new InsightError("Keys must be COLUMNS or ORDER only"));
        }

        if ((Object.keys(query.OPTIONS)[0] === "COLUMNS" && Object.keys(query.OPTIONS)[1] !== "ORDER")
            || (Object.keys(query.OPTIONS)[0] === "ORDER" && Object.keys(query.OPTIONS)[1] !== "COLUMNS")) {
            return Promise.reject(new InsightError("Keys must be COLUMNS or ORDER only"));
        }
        return Promise.resolve();
    }

    public validateCOLUMNS(query: any, queryValidator: QueryValidator): Promise<any> {
            // check that COLUMNS has at least one key
            if (Object.keys(query.OPTIONS.COLUMNS).length < 1) {
                return Promise.reject(new InsightError("COLUMNS must contain at least one key"));
            }

            // check that OPTIONS contains COLUMNS
            if (Object.keys(query.OPTIONS).length === 1) {
                if (Object.keys(query.OPTIONS)[0] !== "COLUMNS") {
                    return Promise.reject(new InsightError("OPTIONS must contain COLUMNS"));
                }
            }

            // check the validity of each key inside COLUMNS
            // for each id_key in columns, split, and check that the key element is one of the valid mkeys or skeys
            let prevID: string = "";
            for (const key of Object.keys(query.OPTIONS.COLUMNS)) {
                let currIDKeyArr = queryValidator.splitIDKey(key);
                let currID: string = currIDKeyArr[0];
                let currKey: string = currIDKeyArr[1];
                if (!queryValidator.isValidField(currKey, "all")) {
                    return Promise.reject(new InsightError("Invalid key"));
                }
                queryValidator.columnFields.push(currKey);

                if ((currID.includes("_") || !currID.trim())) {
                    return Promise.reject(new InsightError("Invalid course id"));
                }
                // check if all keys have the same id
                if (prevID === "" || prevID === currID) {
                    prevID = currID;
                } else {
                    return Promise.reject(new InsightError("all keys must have the same id"));
                }
            }
            queryValidator.columnIDString = prevID;
        }

    public validateORDER(query: any, queryValidator: QueryValidator): Promise<any> {
        // if OPTIONS contains a second OPTION, check that it is ORDER
        // Check if OPTIONS contains ORDER (optional clause)
        // maybe take the following out (in case we can't guarantee the checking at the caller level)
        if (Object.keys(query.OPTIONS).length !== 2) {
            return Promise.reject(new InsightError("COLUMNS can only contain one clause"));
        }
        // when OPTIONS contains ORDER, check that OPTIONS only has one ORDER
        if (!Object.keys(query.OPTIONS).includes("ORDER")) {
            return Promise.reject(new InsightError("OPTIONS must contain one or no ORDER"));
        }
        if (!Object.keys(query.OPTIONS).includes("COLUMNS")) {
            return Promise.reject(new InsightError("OPTIONS must contain one COLUMNS"));
        }
        // when OPTIONS contains ORDER, check that OPTIONS only has one ORDER
        // todo: maybe redundant if caller is also checking but who'sssss responsibility?????
        if (!this.containsCOLUMNSandORDER(query)) {
            return Promise.reject(new InsightError("OPTIONS must have one or no ORDER"));
        }
        // check if ORDER has one key only
        if (Object.keys(query.OPTIONS.ORDER).length !== 1) {
            return Promise.reject(new InsightError("ORDER can only contain one key"));
        }
        // check if ORDER's (singular) key is valid skey or mkey
        let currIDKeyArr = queryValidator.splitIDKey(Object.keys(query.OPTIONS.ORDER)[0]);
        let currID: string = currIDKeyArr[0];
        let currKey: string = currIDKeyArr[1];
        if (!queryValidator.isValidField(currKey, "all")) {
            return Promise.reject(new InsightError("Invalid key"));
        }
        if (queryValidator.columnIDString !== currID) {
            return Promise.reject(new InsightError("Dataset ID must match all other dataset IDs in this query"));
        }
        // check if ORDER's (singular) key is included in COLUMNS
        if (queryValidator.columnFields.includes(currKey)) {
            return Promise.reject(new InsightError("ORDER key must be included in COLUMNS keys "));
        }
    }
}
