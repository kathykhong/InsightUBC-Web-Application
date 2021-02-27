import {InsightError, ResultTooLargeError} from "../controller/IInsightFacade";
import {QueryValidator} from "./QueryValidator";
import Log from "../Util";

export class WhereValidator {
    public validateWHERE(query: any, queryValidator: QueryValidator): void {
        // check if WHERE contains null or undefined values
        if (Object.keys(query).includes(null) || Object.keys(query).includes(undefined)) {
            throw new InsightError("Query cannot contain null or undefined");
        }
        if (Object.values(query).includes(null) || Object.values(query).includes(undefined)) {
            throw new InsightError("Query values cannot be null or undefined");
        }
        // check if WHERE clause exists, maybe redundant if caller is checking
        // added a not here
        if (!Object.keys(query).includes("WHERE")) {
            throw new InsightError("Query must contain valid WHERE");
        }
        // faulty code logic , throws an error right away
        /*if (Object.keys(query)[0] !== "WHERE" || Object.keys(query)[1] !== "WHERE") {
            throw new InsightError("WHERE must be the first or second block");
        }*/
        // check if WHERE clause exists but is empty
        if (Object.keys(query.WHERE).length === 0) {
            throw new InsightError("Where cannot be empty");
        }
        // check if WHERE contains zero or one Filter
        if (Object.keys(query.WHERE).length > 1) {
            throw new InsightError("WHERE can only have maximum one filter");
        }
        // check that the one filter inside WHERE is actually a valid filter by calling validateFILTER
        this.validateFilter(query.WHERE, queryValidator);
        // if it's an AND, an OR, or a NOT
    }

    // if its an M or Scomp, return, if its an Logic or Negation, recurse???
    // todo: figure out how the recursive calls work, what are we passing in to get all filters for the next level
    // todo: Object.keys(query.WHERE)[0] can't be called at for each level of recursion???? help
    public validateFilter(subquery: any, queryValidator: QueryValidator): void {
        switch (Object.keys(subquery)[0]) {
            case "LT": {
                this.validateMComp(subquery, queryValidator);
                break;
            }
            case "GT": {
                this.validateMComp(subquery, queryValidator);
                break;
            }
            case "EQ": {
                this.validateMComp(subquery, queryValidator);
                break;
            }
            case "IS": {
                this.validateIS(subquery, queryValidator);
                break;
            }
            case "AND": {
                this.validateAND(subquery);
                // iterate over the array that is AND
                // changed for in to for of
                for (const arg of subquery.AND) {
                    //   Log.trace("arg: ", arg);
                    // each arg is an object held in the AND array
                    this.validateFilter(arg, queryValidator);
                }
                break;
            }
            case "OR": {
                this.validateOR(subquery);
                // for in to for of
                for (const arg of subquery.OR) {
                    // Log.trace("arg: ", arg);
                    // each arg is an object held in the AND array
                    this.validateFilter(arg, queryValidator);
                }
                break;
            }
            case "NOT": {
                this.validateNOT(subquery, queryValidator);
                let arg = subquery.NOT;
                this.validateFilter(arg, queryValidator);
                break;
            }
            default:
                throw new InsightError("Invalid Filter");
        }
    }

    public validateMComp(query: any, queryValidator: QueryValidator): void {
        // check if WHERE contains null or undefined values
        if (Object.keys(query).includes(null) || Object.keys(query).includes(undefined)) {
            throw new InsightError("Query cannot contain null or undefined");
        }
        if (Object.values(query).includes(null) || Object.values(query).includes(undefined)) {
            throw new InsightError("Query values cannot be null or undefined");
        }
        // check that LT/GT/EQ is not empty
        // query = { GT: {"dsid_field": 98} }
        // query[0] = {"dsid_field": 98}
        // todo: check this logic again
        const operator: string = Object.keys(query)[0];

        if (Object.keys(query).length !== 1) {
            throw new InsightError(operator + " block must have strictly one argument");
        }
        if (Object.keys(query[operator]).length !== 1) {
            throw new InsightError(operator + " block must have one idstring_field argument");
        }
        // check that LT's key:value value is a number
        // query[0][0] = 98
        let argValueLT = Object.values(query[operator])[0];
        if (typeof argValueLT !== "number" || typeof argValueLT === null || typeof argValueLT === undefined) {
            throw new InsightError(operator + " must compare to a number");
        }
        // check that LT is calling on a valid mfield
        let idStringLTarr: string[];
        let argKeyLT = Object.keys(query[operator])[0];
        idStringLTarr = queryValidator.splitIDKey(argKeyLT);
        // check that the id is valid
        if (idStringLTarr.length !== 2) {
            throw new InsightError("More than one underscore was detected in MComp Filter");
        }
        if (!queryValidator.isValidIDString(idStringLTarr[0])) {
            throw new InsightError("invalid ID");
        }
        if (!queryValidator.isValidField(idStringLTarr[1], "mField")) {
            throw new InsightError("invalid mfield specified in MComp Filter");
        }
        // check that id matches all other ids in the query
        if (idStringLTarr[0] !== queryValidator.columnIDString) {
            throw new InsightError("dataset ID must match the rest of the query");
        }
    }

    public validateIS (subquery: any, queryValidator: QueryValidator): void {
        if (Object.keys(subquery).includes(null) || Object.keys(subquery).includes(undefined)) {
            throw new InsightError("Query cannot contain null or undefined");
        }
        if (Object.values(subquery).includes(null) || Object.values(subquery).includes(undefined)) {
            throw new InsightError("Query values cannot be null or undefined");
        }
// todo: check this again
        if (Object.keys(subquery).length !== 1) {
            throw new InsightError( " block must have strictly one argument");
        }
        const operatorIS: string = Object.keys(subquery)[0];
        if (Object.keys(subquery[operatorIS]).length !== 1) {
            throw new InsightError(operatorIS + " block must have one idstring_field argument");
        }
        let argValueIS = Object.values(subquery[operatorIS])[0];
        if (typeof argValueIS !== "string" || typeof argValueIS === null || typeof argValueIS === undefined) {
            throw new InsightError(operatorIS + " must compare to a string");
        }

        let idStringISarr: string[];
        let argKeyIS = Object.keys(subquery[operatorIS])[0];
        idStringISarr = queryValidator.splitIDKey(argKeyIS);
        // check that the id is valid
        if (idStringISarr.length !== 2) {
            throw new InsightError("More than one underscore was detected in MComp Filter");
        }
        if (!queryValidator.isValidIDString(idStringISarr[0])) {
            throw new InsightError("invalid ID");
        }
        if (!queryValidator.isValidField(idStringISarr[1], "sField")) {
            throw new InsightError("invalid sfield specified in IS Filter");
        }
        // check that id matches all other ids in the query
        if (idStringISarr[0] !== queryValidator.columnIDString) {
            throw new InsightError("dataset ID must match the rest of the query");
        }
    }

    public validateAND (subquery: any): void {
        // removed bottom , and array length should be 2 or greater
        /*if (Object.values(subquery.AND).length !== 1) {
            throw new InsightError("AND must contain one value only");
        }*/
        if (!Array.isArray(subquery.AND)) {
            throw new InsightError("AND must contain a single array");
        }
        // maybe redundant to isArray()
        if (subquery.AND === null || subquery.AND === undefined) {
            throw new InsightError("AND cannot contain null or undefined");
        }
        // check if WHERE contains null or undefined values
        if (subquery.AND.includes(null) || subquery.AND.includes(undefined)) {
            throw new InsightError("AND cannot contain null or undefined");
        }
        if (subquery.AND.length <= 1) {
            throw new InsightError("AND's array must contain at least 2 filters");
        }
    }

    public validateOR(subquery: any): void {
        // faulty code logic causing debugger to go straight to error
        /* if (Object.values(subquery.OR).length !== 1) {
             throw new InsightError("OR must contain one value only");
         }*/
        if (!Array.isArray(subquery.OR)) {
            throw new InsightError("OR must contain a single array");
        }
        // maybe redundant to isArray()
        if (subquery.OR === null || subquery.OR === undefined) {
            throw new InsightError("OR cannot contain null or undefined");
        }
        // check if WHERE contains null or undefined values
        if (subquery.OR.includes(null) || subquery.OR.includes(undefined)) {
            throw new InsightError("OR cannot contain null or undefined");
        }
        if (subquery.OR.length <= 1) {
            throw new InsightError("OR's array must contain at least 2 filters");
        }
    }

    public validateNOT(subquery: any, queryValidator: QueryValidator): void {
        if (Object.keys(subquery).length !== 1) {
            throw new InsightError("NOT must contain only one key:value pair");
        }
        if (subquery.NOT === null || subquery.NOT === undefined) {
            throw new InsightError("NOT's value cannot be null or undefined");
        }
        if (Object.values(subquery.NOT).length !== 1) {
            throw new InsightError("NOT's value must be a single object");
        }
        const innerFilter: string = Object.keys(subquery.NOT)[0];
        if (! this.isValidFilterKey(innerFilter, "all", queryValidator)) {
            throw new InsightError("NOT's inner filter must be valid filter");
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
