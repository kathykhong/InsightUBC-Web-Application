import {InsightError} from "../controller/IInsightFacade";

export class TransformationsValidator {
// transformations must contain one group and one apply
    public static validateTRANSFORMATIONS(query: any) {
        if (Object.keys(query).length !== 2) {
            throw new InsightError("TRANSFORMATIONS must have strictly 2 keys");
        }
        if (!Object.keys(query).includes("GROUP")) {
            throw new InsightError("TRANSFORMATIONS must contain GROUP");
        }
        if (!Object.keys(query).includes("APPLY")) {
            throw new InsightError("TRANSFORMATIONS must contain APPLY");
        }
    }
}
