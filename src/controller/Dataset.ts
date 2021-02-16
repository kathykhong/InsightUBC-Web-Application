import {Course} from "./Course";
import InsightFacade from "./InsightFacade";
import {InsightDatasetKind} from "./IInsightFacade";

export class Dataset {
    private courses: Map<string, Course> ;
    private numRows: number;
    private kind: InsightDatasetKind;
    private datasetId: string;

    constructor(dataSetId: string, kind: InsightDatasetKind) {
        this.datasetId = dataSetId;
        this.kind = kind;
        this.courses = new Map();
    }
    public getCourses(): Map<string, Course> {
        return this.courses;
    }
    public getNumRows(): number {
        return this.numRows;
    }
    public setNumRows(numRows: number) {
        this.numRows = numRows;
    }
}
