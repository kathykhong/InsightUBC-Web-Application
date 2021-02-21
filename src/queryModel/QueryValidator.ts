import {InsightError, ResultTooLargeError} from "../controller/IInsightFacade";
import {IInsightFacade} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

export class QueryValidator {
    public allFields: string[] = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
    public sFields: string[] = ["dept", "id", "instructor", "title", "uuid"];
    public mFields: string[] = ["avg", "pass", "fail", "audit", "year"];
    public insightFacade: InsightFacade = new InsightFacade();

    // first check if dataset is in our map, then check if dataset being queried has been added to data dir (disk)
    // json.parse
    public validateQuery(query: any): Promise<any> {
        // check if query is empty
        if (Object.keys(query).length === 0) {
            return Promise.reject(new InsightError("Query is empty"));
        }
        this.validateWHERE(query);
        this.validateOPTIONS(query);

        // check if WHERE keys are all valid
    }

    public validateWHERE(query: any): Promise<any> {
        // check if WHERE clause exists
        if (Object.keys(query).includes("WHERE")) {
            return Promise.reject(new InsightError("Query must contain valid WHERE"));
        }
        // check if WHERE clause exists but is empty
        if (!query["WHERE"]) {
            return Promise.reject(new ResultTooLargeError("Matches all entries."));
        }
    }

    public validateOPTIONS(query: any): Promise<any> {
        if (!Object.keys(query).includes("OPTIONS")) {
            return Promise.reject(new InsightError("Query must contain valid OPTIONS"));
        }
        // check if OPTIONS clause exists but is empty
        if (query.OPTIONS.length === 0) {
            return Promise.reject(new InsightError("Query must contain non-empty OPTIONS"));
        }

        // check validity of COLUMNS
        if (Object.keys(query.OPTIONS).length === 1 || Object.keys(query.OPTIONS).length === 2) {
            this.validateCOLUMNS(query);
        } else {
            return Promise.reject(new InsightError("OPTIONS must have one or two clauses"));
        }

        // check validity of ORDER if it exists
        if (Object.keys(query.OPTIONS).length === 2) {this.validateORDER(query); }
        // todo: check that the key is in column also
        // todo: CONFIRM that the order of keys must be columns, then order? or either?
        // ORDER has one key, check that it is inside COLUMNS
        // if ORDER exists, check that it only contains one key

        // IF BLOCK: COLUMNS and ORDER case
        if (Object.keys(query.OPTIONS).length === 2) {
            if (Object.keys(query.OPTIONS)[0] !== "COLUMNS" || Object.keys(query.OPTIONS)[1] !== "ORDER") {
                return Promise.reject(new InsightError("OPTIONS must contain COLUMNS then ORDER"));
            }

            // check if COLUMNS is empty
            if (Object.keys(query.OPTIONS.COLUMNS).length === 0) {
                return Promise.reject(new InsightError("COLUMNS cannot be empty"));
            }
        }
    }

    public validateORDER(query: any): Promise<any> {
        // if OPTIONS contains a second OPTION, check that it is ORDER
        // Check if OPTIONS contains ORDER (optional clause)

        if (Object.keys(query.OPTIONS).length !== 2) {
            return Promise.reject(new InsightError("COLUMNS can only contain one clause"));
        }
        // when OPTIONS contains ORDER, check that OPTIONS only has one ORDER
        if (Object.keys(query.OPTIONS)[1] !== "ORDER") {
            return Promise.reject(new InsightError("OPTIONS must have one or no ORDER"));
        }

        // check if ORDER has one key only
        // todo: confirm whether this is okay way to access ORDER (is it itself a sub object?)
        if (Object.keys(query.OPTIONS.ORDER).length !== 1) {
            return Promise.reject(new InsightError("ORDER can only contain one key"));
        }
        // check if ORDER's (singular) key is valid skey or mkey
        if (!this.isValidField(Object.keys(query.OPTIONS.ORDER)[0], "all")) {
            return Promise.reject(new InsightError("Invalid key"));
        }
    }

    public validateCOLUMNS(query: any): Promise<any> {
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
        // probably duplicated logic from the above
        if (Object.keys(query.OPTIONS)[0] !== "COLUMNS") {
            return Promise.reject(new InsightError("OPTIONS must contain COLUMNS"));
        }

        // check the validity of each key inside COLUMNS
        // for each id_key in columns, split, and check that the key element is one of the valid mkeys or skeys
        for (const key of Object.keys(query.OPTIONS.COLUMNS)) {
            let currIDKeyArr = this.splitIDKey(key);
            let currKey: string = currIDKeyArr[1];
            if (!this.isValidField(currKey, "all")) {
                return Promise.reject(new InsightError("Invalid key"));
            }
        }
    }

    public splitIDKey(idKey: string): string[] {return idKey.split("_"); }

    public isValidField(field: string, fieldType: string): boolean {
        if (fieldType === "all") {
            if (this.allFields.includes(field)) {return true; }
        } else if (fieldType === "sField") {
            if (this.sFields.includes(field)) {return true; }
        } else if (fieldType === "mField") {
            if (this.mFields.includes(field)) {return true; }
        } else {return false; }
    }
}
