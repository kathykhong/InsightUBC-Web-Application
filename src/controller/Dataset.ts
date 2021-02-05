import {Course} from "./Course";
import InsightFacade from "./InsightFacade";
import {InsightDatasetKind} from "./IInsightFacade";

export class Dataset {
    private courses: Map<string, Course> ;
    private numRows: number;
    private kind: InsightDatasetKind;
    private datasetId: string;

    constructor(dataSetId: string, kind: InsightDatasetKind, numRows: number, courses: Map<string, Course>) {
        this.datasetId = dataSetId;
        this.kind = kind;
        this.numRows = numRows;
        this.courses = courses;
    }
}
