import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError,
} from "./IInsightFacade";
import {Dataset} from "../dataModel/Dataset";
import * as JSZip from "jszip";
import * as fs from "fs";
import {Course} from "../dataModel/Course";
import {Section} from "../dataModel/Section";
import {QueryValidator} from "../queryModel/QueryValidator";
import {QueryProcessor} from "../queryModel/QueryProcessor";
import {CoursesAdder} from "./CoursesAdder";
import {RoomsAdder} from "./RoomsAdder";
import {RoomsQueryProcessor} from "../queryModel/RoomsQueryProcessor";
import {TransformationsProcessor} from "../queryModel/TransformationsProcessor";
import {PerformQueryHelper} from "./PerformQueryHelper";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public currentDatasets: string[] = [];
    public datasetsMap: Map<string, Dataset>;
    public JSONFields: string[] = ["Avg", "Pass", "Fail", "Audit", "Year",
        "Subject", "Course", "Professor", "Title", "id"];

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetsMap = new Map();
        fs.readdir("../../data", (err, files) => {
            if (err) {
                this.datasetsMap = new Map();
            } else {
                Log.trace("\nCurrent directory filenames:");
                files.forEach((file) => {
                    Log.trace(file);
                });
            }
        });

    }

    public addDataset(
        id: string,
        content: string, // check null and undefined
        kind: InsightDatasetKind,
    ): Promise<string[]> {
        if (id.includes("_") || !id.trim() || id === "" || this.isAllWhitespace(id)
            || id === null || id === undefined) {
            return Promise.reject(new InsightError("invalid id"));
        }
        if (this.currentDatasets.includes(id)) {
            return Promise.reject(new InsightError("cannot add a duplicate dataset ID"));
        }
        if (content === null || content === undefined) {
            return Promise.reject(new InsightError("content string cannot be null or undefined"));
        }
        if (fs.existsSync(".data/" + id + ".zip")) {
            return Promise.reject(new InsightError("file already added"));
        }
        let result: Promise<string[]>;
        if (kind === InsightDatasetKind.Courses) {
            let coursesAdder: CoursesAdder = new CoursesAdder();
            result = coursesAdder.addDataSetCourses(id, content, kind, this);
        }
        if (kind === InsightDatasetKind.Rooms) {
            let roomsAdder: RoomsAdder = new RoomsAdder();
            result = roomsAdder.addDatasetRooms(id, content, kind, this);
        }
        return Promise.resolve(result);
    }

    public isAllWhitespace(str: string): boolean {
        let strarr: string[] = str.split("");
        for (const char in strarr) {
            if (char !== " ") {
                return false;
            }
        }
        return true;
    }

    public getResult(r: JSZip): Array<Promise<any>> {
        let result: Array<Promise<any>> = [];
        r.folder("courses").forEach(function (pathname, file) {
            let prom: Promise<any>;
            prom = file.async("string").then(function (response) {
                let parsed = JSON.parse(response);
                return Promise.resolve(parsed);
            });
            result.push(prom);
        });
        return result;
    }

    public extractJSON(datasetJSONs: any[], newDataset: Dataset): Dataset {
        let numRows = 0;
        let courseKey: string;
        for (const course of datasetJSONs) {
            let newCourse: Course;
            newCourse = new Course();
            courseKey = "";
            // for each section object {} in the course (result:)
            for (const section of course.result) {
                let newSection: Section = new Section();
                if (this.containAllJSONFields(section)) {
                    this.setSectionFields(newSection, section);
                    if (courseKey === "") {
                        courseKey = section.Subject + section.id;
                    }
                    newCourse.getSections().push(newSection);
                    numRows++;
                }
            }
            newDataset.getCourses().set(courseKey, newCourse);
        }
        newDataset.setNumRows(numRows);
        return newDataset;
    }

    // param section is a JSON string
    public containAllJSONFields(section: any): boolean {
        for (const fieldname of this.JSONFields) {
            let currSectionKeys: string[] = Object.keys(section);
            if (!currSectionKeys.includes(fieldname)) {
                return false;
            }
        }
        return true;
    }

    public setSectionFields(newSection: Section, section: any) {
        if (section.Section === "overall") {
            newSection.setYear(1900);
        } else {
            newSection.setYear(parseInt(section.Year, 10));
        }
        newSection.setAudit(parseInt(section.Audit, 10));
        newSection.setAvg(parseFloat(section.Avg));
        newSection.setDept(section.Subject);
        newSection.setFail(parseInt(section.Fail, 10));
        newSection.setPass(parseInt(section.Pass, 10));
        newSection.setId(section.Course);
        newSection.setUuid(section.id);
        newSection.setInstructor(section.Professor);
        newSection.setTitle(section.Title);
    }

    // return promise of updated currentDatasets
    public removeDataset(id: string): Promise<string> {
        if (id.includes("_") || !id.trim() || id === "" || this.isAllWhitespace(id)
            || id === null || id === undefined) {
            return Promise.reject(new InsightError("invalid id"));
        }
        if (
            !this.currentDatasets.includes(id) ||
            this.currentDatasets.length === 0
        ) {
            return Promise.reject(new NotFoundError());
        }
        if (!this.datasetsMap.has(id) || this.datasetsMap.size === 0) {
            return Promise.reject(new NotFoundError());
        }

        const path = "./data/" + id;
        fs.unlinkSync(path);
        this.datasetsMap.delete(id);
        this.removeItemOnce(this.currentDatasets, id);
        return Promise.resolve(id);
    }

    public removeItemOnce(arr: any[], id: string) {
        let index = arr.indexOf(id);
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    }

    public listDatasets(): Promise<InsightDataset[]> {
        let result: InsightDataset[] = [];
        for (const dsid of this.datasetsMap.keys()) {
            let currDS: InsightDataset;
            if (this.datasetsMap.get(dsid).getKind() === InsightDatasetKind.Courses) {
                currDS = {
                    id: this.datasetsMap.get(dsid).getDatasetID(),
                    kind: InsightDatasetKind.Courses,
                    numRows: this.datasetsMap.get(dsid).getNumRows(),
                };
            }
            if (this.datasetsMap.get(dsid).getKind() === InsightDatasetKind.Rooms) {
                currDS = {
                    id: this.datasetsMap.get(dsid).getDatasetID(),
                    kind: InsightDatasetKind.Rooms,
                    numRows: this.datasetsMap.get(dsid).getNumRows(),
                };
            }
            result.push(currDS);
        }
        return Promise.resolve(result);
    }

    public performQuery(query: any): Promise<any[]> {
        try {
            let validator: QueryValidator = new QueryValidator();
            // check if query is valid HERE
            validator.validateQuery(query);
            let resultSectionorRoomObjects: any[] = [];
            let datasetIDToQuery: string = validator.columnIDString;
            if (!this.datasetsMap.has(datasetIDToQuery)) { // datasetIDToQuery: "rooms"
                throw new InsightError("reference dataset not added yet");
                // currentDatasets = ["courses"], datasetsMap = {"courses" => Dataset"}
            }
            let dataset: Dataset = this.datasetsMap.get(datasetIDToQuery);
            let datasetKindToQuery: InsightDatasetKind = dataset.getKind();
            let resultObjects: any[] = [];
            let groupApplies: Map<string, Section[]>;
            let output: any[];

            if (datasetKindToQuery === InsightDatasetKind.Courses) {
                let qp: QueryProcessor = new QueryProcessor();
                PerformQueryHelper.coursesQueryProcessorHelper(dataset, qp, query, resultSectionorRoomObjects);
                // check if TRANSFORMAtions
                if (Object.keys(query).includes("TRANSFORMATIONS")) {
                    groupApplies = TransformationsProcessor.handleGroup(query, validator,
                        resultSectionorRoomObjects, dataset);
                    let groupingsArrs: any[] = [];
                    for (let key of groupApplies.keys()) {
                        groupingsArrs.push(groupApplies.get(key)[0]);
                    }
                    output = this.prepareOutputJSON(query, groupingsArrs, validator, resultObjects);
                } else {
                    output = this.prepareOutputJSON(query, resultSectionorRoomObjects, validator, resultObjects);
                }
            } else if (datasetKindToQuery === InsightDatasetKind.Rooms) {
                let rqp: RoomsQueryProcessor = new RoomsQueryProcessor();
                PerformQueryHelper.roomsQueryProcessorHelper(dataset, rqp, query, resultSectionorRoomObjects);

                if (Object.keys(query).includes("TRANSFORMATIONS")) {
                    groupApplies = TransformationsProcessor.handleGroup(query, validator,
                        resultSectionorRoomObjects, dataset);
                    let groupingsArrs: any[] = [];
                    for (let key of groupApplies.keys()) {
                        groupingsArrs.push(groupApplies.get(key)[0]);
                    }
                    output = this.prepareOutputJSON(query, groupingsArrs, validator, resultObjects);
                } else {
                    output = this.prepareOutputJSON(query, resultSectionorRoomObjects, validator, resultObjects);
                }
            }
            return Promise.resolve(output);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    private prepareOutputJSON(query: any, groupingsArr: any[], validator: QueryValidator,
                              resultObjects: any[]) {
        for (const object of groupingsArr) {
            let jsonResultElt: any = {};
            for (let anykey of validator.columnKeys) {
                if (anykey.includes("_")) {
                    let currIDKeyArr = validator.splitIDKey(anykey);
                    let currID = currIDKeyArr[0];
                    anykey = currIDKeyArr[1];
                    jsonResultElt[currID + "_" + anykey] = object.getArg(anykey);
                } else {
                    jsonResultElt[anykey] = object.applyKeyStorage[anykey];
                }
            }
            resultObjects.push(jsonResultElt);
        }
        if (Object.keys(resultObjects).length > 5000) {
            throw new ResultTooLargeError(
                "there cannot be more than 5000 results",
            );
        }
        let sortResult: any[]  = PerformQueryHelper.sortResults(query, resultObjects);
        return sortResult;
    }
}
