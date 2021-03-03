import { Course } from "./Course";
import InsightFacade from "../controller/InsightFacade";
import { InsightDatasetKind } from "../controller/IInsightFacade";

export class Dataset {
    protected courses: Map<string, Course>;
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

    public getKind(): InsightDatasetKind {
        return this.kind;
    }

    public setKind(kind: InsightDatasetKind) {
        this.kind = kind;
    }

    public getNumRows(): number {
        return this.numRows;
    }

    public setNumRows(numRows: number) {
        this.numRows = numRows;
    }

    public getDatasetID(): string {
        return this.datasetId;
    }

    public setDatasetID(id: string) {
        this.datasetId = id;
    }
}
