import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {Dataset} from "./Dataset";
import {Course} from "./Course";
import {Section} from "./Section";
import * as JSZip from "jszip";
import * as fs from "fs";
import {ensureFile, pathExists} from "fs-extra";
import {log} from "util";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

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
                    // unzip
                    let zip = new JSZip();
                    zip.loadAsync(content, { base64: true }).then(function (r) {
                        // console.log(r);
                        // doParse(r);
                        // r is JSzip, r.files -> courses/, and courses/DEPTNUM
                        for (let item in r.files) {
                            // before adding, pick out info we want (sfield and mfield)
                            // for every DEPTNUM access content, convert to string, put in data director
                            // datasets[id] -> string that holds the content for that dataset
                            // datasets[ZOOLonly] -> string: "course: ... id: ..., avg: ..., pass: ... "
                            // datasets[id] -> dir -> course -> content
                            let result: string;
                            if (item.endsWith("/")) { // or dir == true
                                r.folder(item);
                            } else {
                                r.file(item)
                                    .async("string")
                                    .then(function success() {
                                        // maybe success(content)
                                        // use the content
                                        result.concat(content);
                                    }, function error(e) {
                                        // handle the error
                                    });
                            }
                        }
                    }, function error(e) {
                        // handle error
                    });
                }
            }
        }
        // confirm with TA
        // fs.writeFileSync(".data/" + id + ".zip", content);
        // @ts-ignore
        return Promise.reject("Not implemented.");
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
