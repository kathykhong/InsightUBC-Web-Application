import {InsightError} from "../controller/IInsightFacade";
import {QueryValidator} from "./QueryValidator";

export class TransformationsValidator {
    public static GROUPandAPPLYKeys: string[] = [];

    public static validateTRANSFORMATIONS(query: any, qvalidator: QueryValidator) {
        if (Object.keys(query.TRANSFORMATIONS).includes(null) ||
            Object.keys(query.TRANSFORMATIONS).includes(undefined)) {
            throw new InsightError("TRANSFORMATIONS cannot have null or undefined keys");
        }
        if (Object.keys(query.TRANSFORMATIONS).length !== 2) {
            throw new InsightError("TRANSFORMATIONS must have strictly 2 keys");
        }
        if (!Object.keys(query.TRANSFORMATIONS).includes("GROUP")) {
            throw new InsightError("TRANSFORMATIONS must contain GROUP");
        }
        this.validateGROUP(query, qvalidator);
        if (!Object.keys(query.TRANSFORMATIONS).includes("APPLY")) {
            throw new InsightError("TRANSFORMATIONS must contain APPLY");
        }
        this.validateAPPLY(query, qvalidator);
        this.validateCOLUMNSKeysAreInGROUPorAPPLY(query, qvalidator);
    }

    public static validateAPPLY(query: any, qvalidator: QueryValidator) {
        if (Object.values(query.TRANSFORMATIONS.APPLY) === null
            || Object.values(query.TRANSFORMATIONS.APPLY) === undefined) {
            throw new InsightError("TRANSFORMATIONS APPLY cannot be null or undefined values");
        }
        if (!Array.isArray((query.TRANSFORMATIONS.APPLY))) {
            throw new InsightError("APPLY's value must be of type Array");
        }
        for (const applyObject of query.TRANSFORMATIONS.APPLY) {
           if (typeof applyObject !== "object") {
               throw new InsightError("APPLY's array must contain objects only");
           }
           if (Object.keys(applyObject).length !== 1) {
               throw new InsightError("APPLY's array objects must only have one applyKey");
           }
           TransformationsValidator.validateInnerAPPLY(applyObject, qvalidator);
        }

    }

    public static validateInnerAPPLY (applyObject: any, qvalidator: QueryValidator) {
        let innerObject: any = applyObject[Object.keys(applyObject)[0]];
        if (typeof innerObject !== "object") {
            throw new InsightError("APPLY's array objects' values must be objects lmao");
        }
        // innerObject: {"TOKEN" : something}
        // applyObject[Object.keys(applyObject)[0]] = "overallAVG"
        if (Object.keys(applyObject)[0].includes("_")) {
            throw new InsightError("applyobject's keys cannot include an underscore");
        }
        if (this.GROUPandAPPLYKeys.includes(applyObject[Object.keys(applyObject)[0]])) {
            throw new InsightError("Duplicate applyKey detected");
        } else {
            this.GROUPandAPPLYKeys.push(Object.keys(applyObject)[0]);
        }
        if (Object.keys(innerObject).length !== 1) {
            throw new InsightError("APPLY's inner object can only contain one");
        }
        let thisApplyToken: string = Object.keys(innerObject)[0];
        if (!QueryValidator.applyTOKENS.includes(thisApplyToken)) {
            throw new InsightError("invalid APPLYTOKEN");
        }
        let key: string = innerObject[thisApplyToken];
        let currID: string;
        let currKey: string;
        if (key.includes("_")) {
            let currIDKeyArr: string[] = qvalidator.splitIDKey(key);
            currID = currIDKeyArr[0];
            currKey = currIDKeyArr[1];
            if (!qvalidator.isValidIDStringOrApplyKey(currID)) {
                throw new InsightError("Invalid dataset id");
            }
            if (!qvalidator.isValidField(currKey, "all")) {
                throw new InsightError("Field is invalid");
            }
        } else {
            throw new InsightError("All keys in GROUP must be of format idstring_msfield");
        }
        TransformationsValidator.validateApplyTOKEN(thisApplyToken, qvalidator, currKey);
    }


    public static validateGROUP(query: any, qvalidator: QueryValidator) {
        if (Object.values(query.TRANSFORMATIONS.GROUP) === null
            || Object.values(query.TRANSFORMATIONS.GROUP) === undefined) {
            throw new InsightError("TRANSFORMATIONS GROUP cannot be null or undefined values");
        }
        if (!Array.isArray((query.TRANSFORMATIONS.GROUP))) {
            throw new InsightError("GROUP's value must be of type Array");
        }
        if (Object.keys(query.TRANSFORMATIONS.GROUP).length === 0) {
            throw new InsightError("TRANSFORMATIONS GROUP cannot be empty");
        }
        for (const key of query.TRANSFORMATIONS.GROUP) {
            if (key.includes("_")) {
                let currIDKeyArr: string[] = qvalidator.splitIDKey(key);
                let currID: string = currIDKeyArr[0];
                let currKey: string = currIDKeyArr[1];
                if (!qvalidator.isValidIDStringOrApplyKey(currID)) {
                    throw new InsightError("Invalid dataset id");
                }
                if (!qvalidator.isValidField(currKey, "all")) {
                    throw new InsightError("Field is invalid");
                }
                this.GROUPandAPPLYKeys.push(key);
            } else {
                throw new InsightError("All keys in GROUP must be of format idstring_msfield");
            }
        }
    }

    public static validateCOLUMNSKeysAreInGROUPorAPPLY(query: any, qValidator: QueryValidator) {
        // check if columnskeys[] has this group key - is every key in columns key contained in group
        for (const columnkey of qValidator.columnKeys) {
            if (!TransformationsValidator.GROUPandAPPLYKeys.includes(columnkey)) {
                throw new InsightError("everything in COLUMNS must be in GROUP or APPLY");
            }
        }
    }

    public static validateApplyTOKEN (thisApplyToken: string, qvalidator: QueryValidator, currKey: string) {
        switch (thisApplyToken) {
            case "MAX" || "MIN" || "AVG" || "SUM" : {
                if (!qvalidator.isValidField(currKey, "mField")) {
                    throw new InsightError("This applyTOKEN must be applied to mFields only");
                }
                break;
            }
            case "COUNT" : {
                if (!qvalidator.isValidField(currKey, "all")) {
                    throw new InsightError("This applyTOKEN must be applied to sFields and mFields only");
                }
                break;
            }
        }
    }
}
