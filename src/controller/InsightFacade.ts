import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError, ResultTooLargeError
} from "./IInsightFacade";
import {Dataset} from "../dataModel/Dataset";
import * as JSZip from "jszip";
import * as fs from "fs";
import {Course} from "../dataModel/Course";
import {Section} from "../dataModel/Section";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public currentDatasets: string[] = [];
    public datasetsMap: Map<string, Dataset>;
    public allFields: string[] = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
    public sFields: string[] = ["dept", "id", "instructor", "title", "uuid"];
    public mFields: string[] = ["avg", "pass", "fail", "audit", "year"];
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetsMap = new Map();
    }

// TODO: valid zip file check
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        // check id validity
        if (id.includes("_") || !id.trim() || id === "") {
            return Promise.reject(new InsightError("invalid id"));
        } else {
            // check kinds validity
            if (kind === InsightDatasetKind.Rooms) {
                return Promise.reject(new InsightError("insightDataSetKind is Rooms"));
            } else {
                // alternative ensureFileSync
                if (fs.existsSync(".data/" + id + ".zip")) {
                    return Promise.reject(new InsightError("file already added"));
                } else {
                    let newDataset: Dataset;
                    newDataset = new Dataset(id, kind);
                    // unzip
                    let zip = new JSZip();
                    return zip.loadAsync(content, {base64: true})
                        .then((res) => {
                            return Promise.all(this.getResult(res));
                        })
                        .then((jsonresults: any[]) => {
                             newDataset = this.extractJSON(jsonresults, newDataset);
                             if (newDataset.getNumRows() === 0) {
                                 return Promise.reject(new InsightError("Dataset contains 0 sections"));
                             }
                             // Log.trace(id);
                             // Log.trace(jsonresults[1].result);
                             this.datasetsMap.set(id, newDataset);
                             fs.writeFileSync( "./data/" + id, JSON.stringify(jsonresults));
                             this.currentDatasets.push(id);
                             return Promise.resolve(this.currentDatasets);
                             })
                        .catch((err: any) => {
                            // Error unzipping
                            return Promise.reject(new InsightError(err));
                        });
                }
            }
        }
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
                for (const section of course.result ) {
                    let newSection: Section = new Section();
                    this.setSectionFields(newSection, section);
                    if (courseKey === "") {
                            courseKey = section.Subject + section.id;
                    }
                    newCourse.getSections().push(newSection);
                    numRows++;
            }
                newDataset.getCourses().set(courseKey, newCourse);
        }
        newDataset.setNumRows(numRows);
        return newDataset;
    }

    public setSectionFields(newSection: Section, section: any) {
        if (section.Section === "overall") {
            newSection.setYear(1900);
        } else {
            newSection.setYear(parseInt(section.Year, 10));
        }
        newSection.setAudit(parseInt(section.Audit, 10));
        newSection.setAvg(parseInt(section.Avg, 10));
        newSection.setDept(section);
        newSection.setFail(parseInt(section.Fail, 10));
        newSection.setPass(parseInt(section.Pass, 10));
        newSection.setId(section.Course);
        newSection.setUuid(section.id);
        newSection.setInstructor(section.Professor);
        newSection.setTitle(section.Title);
    }

    // return promise of updated currentDatasets
    public removeDataset(id: string): Promise<string> {
        if (id.includes("_") || !id.trim() || id === "") {
            return Promise.reject(new InsightError("invalid id"));
        }
        if (!this.currentDatasets.includes(id) || this.currentDatasets.length === 0 ) {
            return Promise.reject((new NotFoundError("id is not found")));
        }
        if (!this.datasetsMap.has(id) || this.datasetsMap.size === 0) {
            return Promise.reject((new NotFoundError("id is not found")));
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
            let currDS: InsightDataset = {
                id: this.datasetsMap.get(dsid).getDatasetID(),
                kind: InsightDatasetKind.Courses,
                numRows: this.datasetsMap.get(dsid).getNumRows()
            };
            result.push(currDS);
        }
        return Promise.resolve(result);
    }

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
        // check if query is valid
        if (!this.validateQuery(query)) {
            return Promise.reject(new InsightError("Query is invalid")); }
    }

    // first check if dataset is in our map, then check if dataset being queried has been added to data dir (disk)
    // json.parse
    public validateQuery(query: any): Promise<any> {
        // check if query is empty
        if (Object.keys(query).length === 0) {
            return Promise.reject(new InsightError("Query is empty")); }
        this.validateWHERE(query);
        this.validateOPTIONS(query);

        // check if WHERE keys are all valid
    }

    public validateWHERE(query: any): Promise<any> {
        // check if WHERE clause exists
        if (Object.keys(query).includes("WHERE")) {
            return Promise.reject(new InsightError("Query must contain valid WHERE")); }
        // check if WHERE clause exists but is empty
        if (!query["WHERE"]) {
            return Promise.reject(new ResultTooLargeError("Matches all entries.")); }
    }

    public validateOPTIONS(query: any): Promise<any> {
        if (!Object.keys(query).includes("OPTIONS")) {
            return Promise.reject(new InsightError("Query must contain valid OPTIONS")); }
        // check if OPTIONS clause exists but is empty
        if (query.OPTIONS.length === 0) {
            return Promise.reject(new InsightError("Query must contain non-empty OPTIONS")); }

        // check validity of COLUMNS
        if (Object.keys(query.OPTIONS).length === 1 || Object.keys(query.OPTIONS).length === 2) {
            this.validateCOLUMNS(query);
        } else {
            return Promise.reject(new InsightError("OPTIONS must have one or two clauses")); }

        // check validity of ORDER if it exists
        if (Object.keys(query.OPTIONS).length === 2) {this.validateORDER(query); }
        // todo: check that the key is in column also
        // todo: CONFIRM that the order of keys must be columns, then order? or either?
        // ORDER has one key, check that it is inside COLUMNS
        // if ORDER exists, check that it only contains one key

        // IF BLOCK: COLUMNS and ORDER case
        if (Object.keys(query.OPTIONS).length === 2) {
            if (Object.keys(query.OPTIONS)[0] !== "COLUMNS" || Object.keys(query.OPTIONS)[1] !== "ORDER") {
                return Promise.reject(new InsightError("OPTIONS must contain COLUMNS then ORDER")); }

            // check if COLUMNS is empty
            if (Object.keys(query.OPTIONS.COLUMNS).length === 0) {
                return Promise.reject(new InsightError("COLUMNS cannot be empty")); } }
    }

    public validateORDER(query: any): Promise<any> {
            // if OPTIONS contains a second OPTION, check that it is ORDER
            // Check if OPTIONS contains ORDER (optional clause)

        if (Object.keys(query.OPTIONS).length !== 2) {
            return Promise.reject(new InsightError("COLUMNS can only contain one clause")); }
        // when OPTIONS contains ORDER, check that OPTIONS only has one ORDER
        if (Object.keys(query.OPTIONS)[1] !== "ORDER") {
            return Promise.reject(new InsightError("OPTIONS must have one or no ORDER")); }

        // check if ORDER has one key only
        // todo: confirm whether this is okay way to access ORDER (is it itself a sub object?)
        if (Object.keys(query.OPTIONS.ORDER).length !== 1) {
            return Promise.reject(new InsightError("ORDER can only contain one key")); }
        // check if ORDER's (singular) key is valid skey or mkey
        if (!this.isValidField(Object.keys(query.OPTIONS.ORDER)[0], "all")) {
            return Promise.reject(new InsightError("Invalid key")); }
    }

    public validateCOLUMNS(query: any): Promise<any> {
        // check that COLUMNS has at least one key
        if (Object.keys(query.OPTIONS.COLUMNS).length < 1) {
            return Promise.reject(new InsightError("COLUMNS must contain at least one key")); }

        // check that OPTIONS contains COLUMNS
        if (Object.keys(query.OPTIONS).length === 1) {
            if (Object.keys(query.OPTIONS)[0] !== "COLUMNS") {
                return Promise.reject(new InsightError("OPTIONS must contain COLUMNS")); } }
        // probably duplicated logic from the above
        if (Object.keys(query.OPTIONS)[0] !== "COLUMNS") {
            return Promise.reject(new InsightError("OPTIONS must contain COLUMNS")); }

        // check the validity of each key inside COLUMNS
        // for each id_key in columns, split, and check that the key element is one of the valid mkeys or skeys
        for (const key of Object.keys(query.OPTIONS.COLUMNS)) {
            let currIDKeyArr = this.splitIDKey(key);
            let currKey: string = currIDKeyArr[1];
            if (!this.isValidField(currKey, "all")) {
                return Promise.reject(new InsightError("Invalid key")); } }
    }

    public splitIDKey(idKey: string): string[] {return idKey.split("_"); }

    public isValidField(field: string, fieldType: string): boolean {
        if (fieldType === "all") {
            if (this.allFields.includes(field)) {return true; }
        } else if (fieldType === "sField") {
            if (this.sFields.includes(field)) {return true; }
        } else if (fieldType === "mField") {
            if (this.mFields.includes(field)) {return true; }
        } else {return false; } }

}
