import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {Dataset} from "./Dataset";
import * as JSZip from "jszip";
import * as fs from "fs";
import {Course} from "./Course";
import {Section} from "./Section";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }
// TODO: valid zip file check
    // extractJson method
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let result: Promise<string[]>;
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
                            result = Promise.all(this.getResult(res));
                            return result;
                        })
                        .then((jsonresults: any[]) => {
                             newDataset = this.extractJSON(jsonresults, newDataset);
                             return result;
                         })
                        .catch((err: any) => {
                            // Error unzipping
                            return Promise.reject(new InsightError(err));
                        });
                }
            }
        }
        return Promise.reject("Not implemented.");
    }
    // confirm with TA
    // fs.writeFileSync(".data/" + id + ".zip", content);
    // @ts-ignore


    // return an array of promises. each promise for each file.async
    public getResult(r: JSZip): Array<Promise<any>> {
        let result: Array<Promise<any>> = [];
        // check that courses/ exists in the unzipped dir
        // foreach(item)
        Log.trace(r);
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
        // TODO- how to check one dataset has at least one section
        let numRows = 0;
        for (const course of datasetJSONs) {
                let newCourse: Course;
                newCourse = new Course();
                let courseKey: string;
            // for each section object {} in the course (result:)
                for (const section of course.result ) {
                let newSection: Section = new Section();
                this.setSectionFields(newSection, section);
                courseKey = section.Subject + section.id;
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
            newSection.setYear(section.Year.toNumber());
        }
        newSection.setAudit(section.Audit.toNumber());
        newSection.setAvg(section.Avg.toNumber());
        newSection.setDept(section.Subject());
        newSection.setFail(section.Fail.toNumber());
        newSection.setPass(section.Pass.toNumber());
        newSection.setId(section.Course);
        newSection.setUuid(section.id);
        newSection.setInstructor(section.Professor());
        newSection.setTitle(section.Title);
    }


    public removeDataset(id: string): Promise<string> {
        return Promise.reject("Not implemented.");
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
