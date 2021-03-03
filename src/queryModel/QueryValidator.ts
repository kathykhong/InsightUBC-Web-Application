import { InsightError } from "../controller/IInsightFacade";
import { OptionsValidator } from "./OptionsValidator";
import { WhereValidator } from "./WhereValidator";
export class QueryValidator {
    public allFields: string[] = [
        "avg",
        "pass",
        "fail",
        "audit",
        "year",
        "dept",
        "id",
        "instructor",
        "title",
        "uuid",
    ];

    public sFields: string[] = ["dept", "id", "instructor", "title", "uuid"];
    public mFields: string[] = ["avg", "pass", "fail", "audit", "year"];
    public allFilters: string[] = ["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"];
    public logicFilters: string[] = ["AND", "OR"];
    public mCompareFilters: string[] = ["LT", "GT", "EQ"];
    public sCompareFilters: string[] = ["IS"];
    public columnIDString: string;
    public columnFields: string[] = [];

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
        // check if query has exactly 2 arguments
        if (Object.keys(query).length !== 2) {
            throw new InsightError(
                "Query must contain WHERE and OPTIONS arguments",
            );
        }
        // check that query has only a WHERE and an OPTIONS
        this.containsWHEREandOPTIONS(query);
        let optionsValidator: OptionsValidator = new OptionsValidator();
        let whereValidator: WhereValidator = new WhereValidator();
        optionsValidator.validateOPTIONS(query, this);
        whereValidator.validateWHERE(query, this);
    }

    // check if WHERE keys are all valid
    // Object.keys(query[operator])[0]
    public containsWHEREandOPTIONS(query: any): void {
        if (!Object.keys(query).includes("WHERE")) {
            throw new InsightError("Query must contain a WHERE clause");
        }
        if (!Object.keys(query).includes("OPTIONS")) {
            throw new InsightError("Query must contain a OPTIONS clause");
        }
        // major issue here : logic is not correct debugger goes straight to error
        /* if ((Object.keys(query)[0] !== "WHERE") || (Object.keys(query)[0] !== "OPTIONS")) {
            throw new InsightError("Keys must be WHERE or OPTIONS only");
        }
        if ((Object.keys(query)[1] !== "WHERE") || (Object.keys(query)[1] !== "OPTIONS")) {
            throw new InsightError("Keys must be WHERE or OPTIONS only");
        }*/
        if (
            (Object.keys(query)[0] === "WHERE"
                && Object.keys(query)[1] !== "OPTIONS")
            || (Object.keys(query)[0] === "OPTIONS"
            && Object.keys(query)[1] !== "WHERE")
        ) {
            throw new InsightError("Keys must be WHERE or OPTIONS only");
        }
    }

    // todo: validate that all dataset ids match and are valid
    public splitIDKey(idKey: string): string[] {
        return idKey.split("_");
    }

    public isValidIDString(ID: string): boolean {
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
            if (this.allFields.includes(field)) {
                return true;
            }
        } else if (fieldType === "sField") {
            if (this.sFields.includes(field)) {
                return true;
            }
        } else if (fieldType === "mField") {
            if (this.mFields.includes(field)) {
                return true;
            }
        } else {
            return false;
        }
    }
}
