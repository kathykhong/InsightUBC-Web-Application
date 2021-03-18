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
import InsightFacade from "./InsightFacade";
export class CoursesAdder {

    public addDataSetCourses(
        id: string,
        content: string, // check null and undefined
        kind: InsightDatasetKind, insightFacade: InsightFacade ): Promise<string[]> {
        let newDataset: Dataset;
        newDataset = new Dataset(id, kind);
        // unzip
        let zip = new JSZip();
        return zip
            // reads the content and merges with the zip object
            // if zip data is not valid then promise fails
            .loadAsync(content, {base64: true})
            .then((res) => {
                return Promise.all(insightFacade.getResult(res));
            })
            .then((jsonresults: any[]) => {
                newDataset = insightFacade.extractJSON(
                    jsonresults,
                    newDataset,
                );
                if (newDataset.getNumRows() === 0) {
                    return Promise.reject(
                        new InsightError(
                            "Dataset contains 0 sections",
                        ),
                    );
                }
                // Log.trace(id);
                // Log.trace(jsonresults[1].result);
                insightFacade.datasetsMap.set(id, newDataset);
                fs.writeFileSync("./data/" + id, JSON.stringify(jsonresults));
                insightFacade.currentDatasets.push(id);
                return Promise.resolve(insightFacade.currentDatasets);
            })
            .catch((err: any) => {
                // Error unzipping
                return Promise.reject(new InsightError(err));
            });
    }


}
