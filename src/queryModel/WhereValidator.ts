import {InsightError, ResultTooLargeError} from "../controller/IInsightFacade";
import {QueryValidator} from "./QueryValidator";

export class WhereValidator {
    public validateWHERE(query: any, queryValidator: QueryValidator): Promise<any> {
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
        switch (Object.keys(subquery)[0]) {
            case "LT": {
                this.validateLT(subquery, queryValidator);
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
                    this.validateFilter(arg, queryValidator);
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
    public validateLT(query: any, queryValidator: QueryValidator): Promise<any> {
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
            idStringLT = queryValidator.splitIDKey(argLT);
        } else {
            return Promise.reject(new InsightError("invalid key format. Must separate idstring from field"));
        }

        if (!queryValidator.mFields.includes(idStringLT[1])) {
            return Promise.reject(new InsightError("invalid mfield specified"));
        }
        // check that the id is valid
        if (!queryValidator.isValidIDString(idStringLT[0])) {
            return Promise.reject(new InsightError("invalid ID"));
        }

        // check that id matches all other ids in the query
        if (idStringLT[0] !== queryValidator.columnIDString) {
            return Promise.reject(new InsightError("dataset ID must match the rest of the query"));
        }
    }
}
