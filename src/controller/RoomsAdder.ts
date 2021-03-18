import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
} from "./IInsightFacade";
import {Dataset} from "../dataModel/Dataset";
import * as JSZip from "jszip";
import InsightFacade from "./InsightFacade";
import * as fs from "fs";
import * as path from "path";
const parse5 = require("parse5");
export class RoomsAdder {
    public tableList: any[] = [];
    public listBuildingPaths: string[] = [];
    public listBuildingCodes: string[] = [];
    public buildingPathMap: Map<string, string> = new Map();
    public zip: JSZip;
    public addDatasetRooms(
        id: string,
        content: string, // check null and undefined
        kind: InsightDatasetKind, insightFacade: InsightFacade ): Promise<string[]> {
        let newRoomsDataset: Dataset;
        newRoomsDataset = new Dataset(id, kind);
        let zip = new JSZip();
        zip.loadAsync(content, {base64: true})
            .then((res) => {
                this.zip = res;
                return this.getHTMLresult(res);
            }).then((htmlString) => {
                return this.parseHTML(htmlString);
        }).then((parsedData: any) => {
            this.extractRoomsData(parsedData, newRoomsDataset, this.zip);
        });

        return Promise.resolve([]);
    }

    public parseHTML(html: string): Promise<any> {
        return Promise.resolve(parse5.parse(html));
    }

    public getHTMLresult (res: JSZip): Promise<string> {
        let folder = res.folder("rooms");
        let index = folder.file("index.htm");
        let prom: Promise<string>;
        prom = index.async("string");
        return prom;
        }

    public extractRoomsData(element: any, dataset: Dataset, zipObj: JSZip) {
        let result: Array<Promise<any>> = [];
        this.extractBuildingPaths(element);
        return Promise.resolve(this.getBuildingsHTMLresult(zipObj))
            .then((htmlString: any[]) => {
                Log.trace("hi");
             //   this.parse

            });
    }

    public getBuildingsHTMLresult(res: JSZip) {
        let listOfBuildingPaths = this.buildingPathMap.values();
        let result: Array<Promise<any>> = [];
        for (let buildingPath of listOfBuildingPaths) {
            try {

                let buildingFile = res.file(buildingPath);
                let prom: Promise<string>;
                prom = buildingFile.async("string");
                result.push(prom);
                Log.trace("hello");
            } catch (err) {
                Log.trace(err);
            }
        }
        return Promise.all(result);
    }

    public extractBuildingPaths(element: any) {
        this.findTables(element);
        let listOfTables: any[] = this.tableList;
        let validTable: any = this.findValidBuildingsTable(listOfTables);
        this.findBuildingPaths(validTable);
        let buildingPathList: string[] = this.removeRepeatedData(this.listBuildingPaths);

        for (let buildingPath of buildingPathList) {
            buildingPath = this.modifyBuildingPath(buildingPath);
            let buildingCode: string = this.extractBuildingCode(buildingPath);
            this.buildingPathMap.set(buildingCode, buildingPath);
            Log.trace("hi");
        }
    }
    public modifyBuildingPath(pathName: string) {
        pathName = pathName.substring(1);
        pathName = "rooms" + pathName;
        return pathName;
    }

    public removeRepeatedData(data: string[]) {
        let unique: string[] = [];
        data.forEach((element) => {
            if (!unique.includes(element)) {
                unique.push(element);
            }
        });
        return unique;
    }

    public extractBuildingCode(buildingPath: string) {
        let pathSplitArr: string[] = buildingPath.split("/");
        let code = pathSplitArr[pathSplitArr.length - 1];
        return code;
    }
    public findBuildingPaths(tBodyElement: any) {
        if (tBodyElement.nodeName === "a" && tBodyElement.attrs.length > 0
            && tBodyElement.attrs[0].name === "href") {
            let buildingPath: string = tBodyElement.attrs[0].value;
            this.listBuildingPaths.push(buildingPath);
        }
        if (tBodyElement.childNodes && tBodyElement.childNodes.length > 0) {
            for (let child of tBodyElement.childNodes) {
                this.findBuildingPaths(child);
            }
        }
    }

    public findValidBuildingsTable(listOfTables: any) {
        for (let table of listOfTables) {
                let tableHeader = table.childNodes[1];
                if (tableHeader.childNodes[1].nodeName === "tr") {
                    let headerRows = tableHeader.childNodes[1];

                    if (headerRows.childNodes[1].nodeName === "th") {
                        let tableHeading = headerRows.childNodes[1];
                        if (tableHeading.attrs.length > 0
                            && tableHeading.attrs[0].value === "views-field views-field-field-building-image" ) {
                            return table;
                        }
                    }
                }
        }
    }
    public findTables(element: any): any {
        if (element.nodeName === "table" && element.childNodes.length > 0 &&
            element.childNodes[1].nodeName === "thead") {
                this.tableList.push(element);
            }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                this.findTables(child);
            }
        }
    }


}
