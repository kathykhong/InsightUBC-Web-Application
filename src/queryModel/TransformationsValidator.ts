import {InsightError} from "../controller/IInsightFacade";

export class TransformationsValidator {
// transformations must contain one group and one apply
    public static validateTRANSFORMATIONS(query: any) {
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
        if (!Object.keys(query.TRANSFORMATIONS).includes("APPLY")) {
            throw new InsightError("TRANSFORMATIONS must contain APPLY");
        }
    }
}
