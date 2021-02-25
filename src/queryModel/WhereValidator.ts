import {InsightError, ResultTooLargeError} from "../controller/IInsightFacade";
import {QueryValidator} from "./QueryValidator";
import Log from "../Util";

export class WhereValidator {
    public validateWHERE(query: any, queryValidator: QueryValidator): Promise<any> {
        // check if WHERE contains null or undefined values
        if (Object.keys(query).includes(null) || Object.keys(query).includes(undefined)) {
            return Promise.reject(new InsightError("Query cannot contain null or undefined"));
        }
        if (Object.values(query).includes(null) || Object.values(query).includes(undefined)) {
            return Promise.reject(new InsightError("Query values cannot be null or undefined"));
        }
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
        this.validateFilter(query.WHERE, queryValidator);
        return Promise.resolve();
        // if it's an AND, an OR, or a NOT
    }

    // if its an M or Scomp, return, if its an Logic or Negation, recurse???
    // todo: figure out how the recursive calls work, what are we passing in to get all filters for the next level
    // todo: Object.keys(query.WHERE)[0] can't be called at for each level of recursion???? help
    public validateFilter(subquery: any, queryValidator: QueryValidator): Promise<any> {
        try {
            switch (Object.keys(subquery)[0]) {
                case "LT": {
                    this.validateMComp(subquery, queryValidator);
                    return Promise.resolve();
                }
                case "GT": {
                    this.validateMComp(subquery, queryValidator);
                    return Promise.resolve();
                }
                case "EQ": {
                    this.validateMComp(subquery, queryValidator);
                    return Promise.resolve();
                }
                case "IS": {
                    // this.validateIS(subquery, queryValidator);
                    return Promise.resolve();
                }
                case "AND": {
                    this.validateAND(subquery, queryValidator);
                    // iterate over the array that is AND
                    for (const arg in subquery.AND) {
                        Log.trace("arg: ", arg);
                        // each arg is an object held in the AND array
                        this.validateFilter(arg, queryValidator);
                    }
                    return Promise.resolve();
                }
                case "OR": {
                    this.validateOR(subquery, queryValidator);
                    for (const arg in subquery.OR) {
                        Log.trace("arg: ", arg);
                        // each arg is an object held in the AND array
                        this.validateFilter(arg, queryValidator);
                    }
                    return Promise.resolve();
                }
                case "NOT": {
                    this.validateNOT(subquery, queryValidator);
                    let arg = subquery.NOT;
                    this.validateFilter(arg, queryValidator);
                    return Promise.resolve();
                }
                default:
                    return Promise.reject(new InsightError("Invalid Filer"));
            }
        } catch (err) {
            Promise.reject(err);
        }
    }

    public validateMComp(query: any, queryValidator: QueryValidator): Promise<any> {
        // check if WHERE contains null or undefined values
        if (Object.keys(query).includes(null) || Object.keys(query).includes(undefined)) {
            return Promise.reject(new InsightError("Query cannot contain null or undefined"));
        }
        if (Object.values(query).includes(null) || Object.values(query).includes(undefined)) {
            return Promise.reject(new InsightError("Query values cannot be null or undefined"));
        }
        // check that LT/GT/EQ is not empty
        // query = { GT: {"dsid_field": 98} }
        // query[0] = {"dsid_field": 98}
        const operator: string = Object.keys(query)[0];

        if (Object.keys(query).length !== 1) {
            return Promise.reject(new InsightError(operator + " block must have strictly one argument"));
        }
        if (Object.keys(query[operator]).length !== 1) {
            return Promise.reject(new InsightError(operator + " block must have one idstring_field argument"));
        }
        // check that LT's key:value value is a number
        // query[0][0] = 98
        let argValueLT = Object.values(query[operator])[0];
        if (typeof argValueLT !== "number" || typeof argValueLT === null || typeof argValueLT === undefined) {
            return Promise.reject(new InsightError(operator + " must compare to a number"));
        }
        // check that LT is calling on a valid mfield
        let idStringLTarr: string[];
        let argKeyLT = Object.keys(query[operator])[0];
        idStringLTarr = queryValidator.splitIDKey(argKeyLT);
        // check that the id is valid
        if (idStringLTarr.length !== 2) {
            return Promise.reject(new InsightError("More than one underscore was detected in MComp Filter"));
        }
        if (!queryValidator.isValidIDString(idStringLTarr[0])) {
            return Promise.reject(new InsightError("invalid ID"));
        }
        if (!queryValidator.isValidField(idStringLTarr[1], "mField")) {
            return Promise.reject(new InsightError("invalid mfield specified in MComp Filter"));
        }
        // check that id matches all other ids in the query
        if (idStringLTarr[0] !== queryValidator.columnIDString) {
            return Promise.reject(new InsightError("dataset ID must match the rest of the query"));
        }
    }

    public validateAND (subquery: any, queryValidator: QueryValidator): Promise<any> {
        if (Object.values(subquery.AND).length !== 1) {
            return Promise.reject(new InsightError("AND must contain one value only"));
        }
        if (!Array.isArray(subquery.AND)) {
            return Promise.reject(new InsightError("AND must contain a single array"));
        }
        // maybe redundant to isArray()
        if (subquery.AND === null || subquery.AND === undefined) {
            return Promise.reject(new InsightError("AND cannot contain null or undefined"));
        }
        // check if WHERE contains null or undefined values
        if (subquery.AND.includes(null) || subquery.AND.includes(undefined)) {
            return Promise.reject(new InsightError("AND cannot contain null or undefined"));
        }
        if (subquery.AND.length <= 1) {
            return Promise.reject(new InsightError("AND's array must contain at least 2 filters"));
        }
    }

    public validateOR(subquery: any, queryValidator: QueryValidator): Promise<any> {
        if (Object.values(subquery.OR).length !== 1) {
            return Promise.reject(new InsightError("OR must contain one value only"));
        }
        if (!Array.isArray(subquery.OR)) {
            return Promise.reject(new InsightError("OR must contain a single array"));
        }
        // maybe redundant to isArray()
        if (subquery.OR === null || subquery.OR === undefined) {
            return Promise.reject(new InsightError("OR cannot contain null or undefined"));
        }
        // check if WHERE contains null or undefined values
        if (subquery.OR.includes(null) || subquery.OR.includes(undefined)) {
            return Promise.reject(new InsightError("OR cannot contain null or undefined"));
        }
        if (subquery.OR.length <= 1) {
            return Promise.reject(new InsightError("OR's array must contain at least 2 filters"));
        }
    }

    public validateNOT(subquery: any, queryValidator: QueryValidator): Promise<any> {
        if (Object.keys(subquery).length !== 1) {
            return Promise.reject(new InsightError("NOT must contain only one key:value pair"));
        }
        if (subquery.NOT === null || subquery.NOT === undefined) {
            return Promise.reject(new InsightError("NOT's value cannot be null or undefined"));
        }
        if (Object.values(subquery.NOT).length !== 1) {
            return Promise.reject(new InsightError("NOT's value must be a single object"));
        }
        const innerFilter: string = Object.keys(subquery.NOT)[0];
        if (! this.isValidFilterKey(innerFilter, "all", queryValidator)) {
            return Promise.reject(new InsightError("NOT's inner filter must be valid filter"));
        }
    }

    public isValidFilterKey(filter: string, type: string, queryValidator: QueryValidator): boolean {
        if (type === "all") {
            return queryValidator.allFilters.includes(filter);
        }
        if (type === "logicFilter") {
            return queryValidator.logicFilters.includes(filter);
        }
        if (type === "mCompareFilters") {
            return queryValidator.mCompareFilters.includes(filter);
        }
        if (type === "sCompareFilters") {
            return queryValidator.sCompareFilters.includes(filter);
        }
    }
}
