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
    }

    // TODO: valid zip file check
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
        // alternative ensureFileSync
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

    // confirm with TA
    // fs.writeFileSync(".data/" + id + ".zip", content);

    // return an array of promises. each promise for each file.async
    public getResult(r: JSZip): Array<Promise<any>> {
        let result: Array<Promise<any>> = [];
        // check that courses/ exists in the unzipped dir
        // foreach(item)
        // Log.trace(r);
        // clarify with TA wtf .folder does
        r.folder("courses").forEach(function (pathname, file) {
            let prom: Promise<any>;
            prom = file.async("string").then(function (response) {
                let parsed = JSON.parse(response);
                return Promise.resolve(parsed);
                // result.push(parsed);
            });
            result.push(prom);
        });
        return result;
    }

    // TODO: where to initialize our new dataset, each course, each section, and link them together
    // TODO: figure out how to set new course, bc constructor takes in a list of sections.
    public extractJSON(datasetJSONs: any[], newDataset: Dataset): Dataset {
        // for each course object in datasetJSONs
        // TODO:  check for valid /course root directory
        // TODO:  for valid courses will be in json format
        //
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

        // remove from data dir
        const path = "./data/" + id;
        fs.unlinkSync(path);
        // remove from ds arr and map
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
        // [ {id, kind, numrows} {} {} ]
        // from datasetMap, retrieve id, kind, numrows for each datasets
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

    // in validate make sure fields are valid
    // {courses: {},
    //     rooms: {},
    //     courseOneID: {}}
    // check if query is valid - options first, then where
    // Abstract data tree for query (nested object)
    // grab the data
    // check memory and disk for dataset being queried
    // check the query, do the filtering with the dataset
    // read the query into our query data struct
    // for every level in the query, we want to
    // input: query: JSON -> JSON
    // instance of insightfacade for our dataset. pass this in
    public performQuery(query: any): Promise<any[]> {
        try {
            let validator: QueryValidator = new QueryValidator();
            // check if query is valid
            validator.validateQuery(query);
            let resultSectionObjects: any[] = [];
            let datasetIDToQuery: string = validator.columnIDString;
            if (!this.datasetsMap.has(datasetIDToQuery)) {
                throw new InsightError("reference dataset not added yet");
            }
            let dataset: Dataset = this.datasetsMap.get(datasetIDToQuery);
            let datasetKindToQuery: InsightDatasetKind = dataset.getKind();
            let resultObjects: any[] = [];
            if (datasetKindToQuery === InsightDatasetKind.Courses) {
                let qp: QueryProcessor = new QueryProcessor();
                for (const course of dataset.getCourses().values()) {
                    for (const section of course.getSections()) {
                        if (qp.checkFilterCondMet(section, query.WHERE)) {
                            resultSectionObjects.push(section);
                        }
                    }
                }
                for (const sectionObject of resultSectionObjects) {
                    let jsonResultElt: any = {};
                    for (const anykey of validator.columnKeys) {
                        jsonResultElt[anykey] = sectionObject.getArg(anykey);
                    }
                    resultObjects.push(jsonResultElt);
                }
            } else if (datasetKindToQuery === InsightDatasetKind.Rooms) {
                let rqp: RoomsQueryProcessor = new RoomsQueryProcessor();
                for (const building of dataset.getBuildings()) {
                    for (const room of building.getListOfRooms()) {
                        if (rqp.checkFilterCondMet(room, query.WHERE)) {
                            resultSectionObjects.push(room);
                        }
                    }
                }
                for (const roomObject of resultSectionObjects) {
                    let jsonResultElt: any = {};
                    for (const anykey of validator.columnKeys) {
                        jsonResultElt[anykey] = roomObject.getRoomArg(anykey);
                    }
                    resultObjects.push(jsonResultElt);
                }
            }

            if (Object.keys(resultObjects).length > 5000) {
                throw new ResultTooLargeError(
                    "there cannot be more than 5000 results",
                );
            }

            if (Object.keys(query.OPTIONS).length === 2) {
                let argSort = query.OPTIONS.ORDER;
                resultObjects.sort((a, b) => a[argSort] - b[argSort]);
            }
            return Promise.resolve(resultObjects);
        } catch (err) {
            return Promise.reject(err);
        }
    }
}
