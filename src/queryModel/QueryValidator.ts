import {InsightError, ResultTooLargeError} from "../controller/IInsightFacade";
import InsightFacade from "../controller/InsightFacade";

export class QueryValidator {
    public allFields: string[] = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
    public sFields: string[] = ["dept", "id", "instructor", "title", "uuid"];
    public mFields: string[] = ["avg", "pass", "fail", "audit", "year"];
    public allFilters: string[] = ["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"];
    public logicFilters: string[] = ["AND", "OR"];
    public mCompareFilters: string[] = ["LT", "GT", "EQ"];
    public sCompareFilters: string[] = ["IS"];
    public columnIDString: string;
    public columnFields: string[] = [];
    public insightFacade: InsightFacade = new InsightFacade();

    // first check if dataset is in our map, then check if dataset being queried has been added to data dir (disk)
    public validateQuery(query: any): Promise<any> {
        // check if query is empty
        if (Object.keys(query).length === 0) {
            return Promise.reject(new InsightError("Query is empty"));
        }
        // check if query has exactly 2 arguments
        if (Object.keys(query).length !== 2) {
            return Promise.reject(new InsightError("Query must contain 2 arguments"));
        }
        if (Object.keys(query).length === 2) {
            // check that query has only a WHERE and an OPTIONS
            if (!this.containsWHEREandOPTIONS(query)) {
                return Promise.reject(new InsightError("Query must contain WHERE and OPTIONS blocks"));
            } else {
                this.validateWHERE(query);
                this.validateOPTIONS(query);
            }
        } // check if WHERE keys are all valid
    }
    public containsWHEREandOPTIONS(query: any): Promise<any> {
        if (!Object.keys(query).includes("WHERE")) {
            return Promise.reject(new InsightError("Query must contain a WHERE clause"));
        }
        if (!Object.keys(query).includes("OPTIONS")) {
            return Promise.reject(new InsightError("Query must contain a OPTIONS clause"));
        }
        if ((Object.keys(query[0] !== "WHERE")) || (Object.keys(query[0] !== "OPTIONS"))) {
            return Promise.reject(new InsightError("Keys must be WHERE or OPTIONS only"));
        }
        if ((Object.keys(query[1] !== "WHERE")) || (Object.keys(query[1] !== "OPTIONS"))) {
            return Promise.reject(new InsightError("Keys must be WHERE or OPTIONS only"));
        }
        if ((Object.keys(query)[0] === "WHERE" && Object.keys(query)[1] !== "OPTIONS")
            || (Object.keys(query)[0] === "OPTIONS" && Object.keys(query)[1] !== "WHERE")) {
            return Promise.reject(new InsightError("Keys must be WHERE or OPTIONS only"));
        }
    }
    // todo: validate that all dataset ids match and are valid

    public validateWHERE(query: any): Promise<any> {
        // check if WHERE clause exists, maybe redundant if caller is checking
        if (Object.keys(query).includes("WHERE")) {
            return Promise.reject(new InsightError("Query must contain valid WHERE"));
        }
        if (Object.keys(query)[0] !== "WHERE" || Object.keys(query)[1] !== "WHERE") {
            return Promise.reject(new InsightError("WHERE must be the first or second block"));
        }
        // check if WHERE clause exists but is empty
        if (Object.keys(query.WHERE).length === 0) {
            return Promise.reject(new ResultTooLargeError("Matches all entries."));
        }
        // check if WHERE contains zero or one Filter
        if (Object.keys(query.WHERE).length > 1) {
            return Promise.reject(new InsightError("WHERE can only have maximum one filter"));
        }
        // check that the one filter inside WHERE is actually a valid filter by calling validateFILTER
        this.validateFilter(query.WHERE);
        return Promise.resolve();
        // if it's an AND, an OR, or a NOT
    }
    // if its an M or Scomp, return, if its an Logic or Negation, recurse???
    // todo: figure out how the recursive calls work, what are we passing in to get all filters for the next level
    // todo: Object.keys(query.WHERE)[0] can't be called at for each level of recursion???? help
    public validateFilter(subquery: any): Promise<any> {
        switch (Object.keys(subquery)[0]) {
            case "LT": {
                this.validateLT(subquery);
                return Promise.resolve();
                break;
            }
            case "GT": {
                // validateGT(); ?
                return Promise.resolve();
                break;
            }
            case "EQ": {
                // validateEQ(); ?
                return Promise.resolve();
                break;
            }
            case "IS": {
                // validateIS(); ?
                return Promise.resolve();
                break;
            }
            case "AND": {
                // validateAND(); ?
                // iterate over the array that is AND
                for (const arg in subquery.AND) {
                    // each arg is an object held in the AND array
                    this.validateFilter(arg);
                }
                return Promise.resolve();
                break;
            }
            case "OR": {
                // validateOR();
                return Promise.resolve();
                break;
            }
            case "NOT": {
                // validateNOT();
                return Promise.resolve();
                break;
            }
        }
    }

    // todo: what are we passing in though
    public validateLT(query: any): Promise<any> {
        // check that LT is not empty
        if (Object.keys(query.WHERE.LT).length !== 1) {
            return Promise.reject(new InsightError("LT block must have one idstring_field argument"));
        }
        // check that LT's key:value value is a number
        let argLT = Object.keys(query.WHERE.LT)[0];
        if (typeof query.WHERE.LT.argLT !== "number") {
            return Promise.reject(new InsightError("LT must compare to a number"));
        }
        // check that LT is calling on a valid mfield
        let idStringLT: string[];
        if (argLT.includes("_")) {
            idStringLT = this.splitIDKey(argLT);
        } else {
            return Promise.reject(new InsightError("invalid key format. Must separate idstring from field"));
        }

        if (!this.mFields.includes(idStringLT[1])) {
            return Promise.reject(new InsightError("invalid mfield specified"));
        }

        // check that the id is valid
        if (!this.isValidIDString(idStringLT[0])) {
            return Promise.reject(new InsightError("invalid ID"));
        }

        // check that id matches all other ids in the query
        if (idStringLT[0] !== this.columnIDString) {
            return Promise.reject(new InsightError("dataset ID must match the rest of the query"));
        }

    }

    public validateOPTIONS(query: any): Promise<any> {
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
            this.validateCOLUMNS(query);
        } else if (Object.keys(query.OPTIONS).length === 2) {
            if (!this.containsCOLUMNSandORDER(query)) {
                return Promise.reject(new InsightError("If OPTIONS body has 2 arguments, they must" +
                    "be COLUMNS and ORDER"));
            } else {
                // must call validateCOLUMNS before validateORDER for global var to be set
                this.validateCOLUMNS(query);
                this.validateORDER(query);
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

        // check the validity of each key inside COLUMNS
        // for each id_key in columns, split, and check that the key element is one of the valid mkeys or skeys
        let prevID: string = "";
        for (const key of Object.keys(query.OPTIONS.COLUMNS)) {
            let currIDKeyArr = this.splitIDKey(key);
            let currID: string = currIDKeyArr[0];
            let currKey: string = currIDKeyArr[1];
            if (!this.isValidField(currKey, "all")) {
                return Promise.reject(new InsightError("Invalid key"));
            }
            this.columnFields.push(currKey);

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
        this.columnIDString = prevID;
    }

    public validateORDER(query: any): Promise<any> {
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
        let currIDKeyArr = this.splitIDKey(Object.keys(query.OPTIONS.ORDER)[0]);
        let currID: string = currIDKeyArr[0];
        let currKey: string = currIDKeyArr[1];
        if (!this.isValidField(currKey, "all")) {
            return Promise.reject(new InsightError("Invalid key"));
        }
        if (this.columnIDString !== currID) {
            return Promise.reject(new InsightError("Dataset ID must match all other dataset IDs in this query"));
        }

        // check if ORDER's (singular) key is included in COLUMNS
        if (!this.columnFields.includes(currKey)) {
            return Promise.reject(new InsightError("ORDER key must be included in COLUMNS keys "));
        }
    }

    public splitIDKey(idKey: string): string[] {return idKey.split("_"); }

    public isValidIDString(ID: string): boolean {
        if (ID.length < 1) {return false; }
        if (ID.includes("_")) {return false; }
        return true; }

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
