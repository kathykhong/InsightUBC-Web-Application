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
        let datasetToAdd: Dataset;
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
                    // unzip
                    let zip = new JSZip();
                    return zip.loadAsync(content, {base64: true})
                        .then((res) => {
                            return Promise.all(this.getResult(res));
                        })
                        // TODO: implement extraction method to read the fields, make our internal representation
                        // TODO: of the dataset
                        // .then((jsonresults: Array<string>) => {
                        //     extractJSON(jsonresults);
                        // })

                        .catch((err: any) => {
                            // Error unzipping
                            return Promise.reject(new InsightError(err));
                    });
                    // console.log(r);
                    // doParse(r);
                    // return zip.folder("courses").forEach( function (filename) {
                    //      zip.files[filename].async("string").then( function (responseString) {
                    //          let res: any = JSON.parse(responseString);
                    //          Log.trace(res);
                    //      });
                    //  });
                    // eslint-disable-next-line @typescript-eslint/tslint/config
                    // r is JSzip, r.files -> courses/, and courses/DEPTNUM
                    // before adding, pick out info we want (sfield and mfield)
                    // for every DEPTNUM access content, convert to string, put in data director
                    // datasets[id] -> string that holds the content for that dataset
                    // datasets[ZOOLonly] -> string: "course: ... id: ..., avg: ..., pass: ... "
                    // datasets[id] -> dir -> course -> content
                    // handle error
                }
            }
        }
        return Promise.reject("Not implemented.");
    }
        // confirm with TA
        // fs.writeFileSync(".data/" + id + ".zip", content);
        // @ts-ignore


    // return an array of promises. each promise for each file.async
    public getResult(r: JSZip): Array<Promise<string>> {
        let result: Array<Promise<string>> = [];
        // check that courses/ exists in the unzipped dir
        // foreach(item)
        Log.trace(r);
        // clarify with TA wtf .folder does
        r.folder("courses").forEach(function (pathname, file) {
            let prom: Promise<string>;
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
    public extractJSON(datasetJSONs: string[], newDataset: Dataset) {
        // for each in datasetJSONs, get this course
        for (const course of datasetJSONs) {
            let newCourse: Course;
            // within each course, get each section
            for (const section of course) {
                let newSection: Section = new Section();
                // within each section, retrieve and store sfields and mfields, count rows = sections
            }
        }

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
