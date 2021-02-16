import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
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
    public currentDatasets: string[] = [];
    public datasetsMap: Map<string, Dataset>;
    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasetsMap = new Map();
    }

// TODO: valid zip file check
    // extractJson method
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
        fs.unlink(path, (error) => {
            if (error) {
                throw new InsightError("Could not unlink file in directory");
            }
        });

        // remove from ds arr and map
        this.datasetsMap.delete(id);
        this.removeItemOnce(this.currentDatasets, id);
        return Promise.resolve(id);
    }

    private removeItemOnce(arr: any[], id: string) {
        let index = arr.indexOf(id);
        if (index > -1) {
            arr.splice(index, 1);
        }
        return arr;
    }

    public performQuery(query: any): Promise<any[]> {
        return Promise.reject("Not implemented.");
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return Promise.reject("Not implemented.");
    }
}
