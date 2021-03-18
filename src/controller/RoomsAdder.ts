import Log from "../Util";
import {
    InsightDatasetKind,
    InsightError
} from "./IInsightFacade";
import {Dataset} from "../dataModel/Dataset";
import * as JSZip from "jszip";
import InsightFacade from "./InsightFacade";
import * as fs from "fs";
import {Building} from "../dataModel/Building";
import * as http from "http";
import {Room} from "../dataModel/Room";
import {RoomsHelper} from "./RoomsHelper";

const parse5 = require("parse5");

export class RoomsAdder {

    public dirtyRoomsRows: any[] = [];
    public dirtyRoomsTables: any[] = [];
    public buildingTableList: any[] = [];
    public listBuildingPaths: string[] = [];
    public buildingPathMap: Map<string, string> = new Map();
    public zip: JSZip;
    public parsedBuildings: any[];
    public geoBuildingNames: string[] = [];

    public addDatasetRooms(
        id: string,
        content: string, // check null and undefined
        kind: InsightDatasetKind, insightFacade: InsightFacade): Promise<string[]> {
        let newRoomsDataset: Dataset;
        newRoomsDataset = new Dataset(id, kind);
        let zip = new JSZip();
        return zip
            .loadAsync(content, {base64: true})
            .then((res) => {
                this.zip = res;
                return this.getHTMLindexResult(res);
            })
            .then((htmlString) => {
                return this.parseHTML(htmlString);
            })
            .then((parsedIndex: any) => {
                return this.extractRoomsData(parsedIndex, newRoomsDataset, this.zip);
            })
            .then((data) => {
                    insightFacade.datasetsMap.set(id, data);
                    let datasetInJSONform = JSON.stringify(data);
                    fs.writeFileSync("./data/" + id, datasetInJSONform);
                    Log.trace("JSON");
                    insightFacade.currentDatasets.push(id);
                    return Promise.resolve(insightFacade.currentDatasets);
            })
            .catch((err: any) => {
                // Error unzipping
                return Promise.reject(new InsightError(err));
            });
    }

    public parseHTML(html: string): Promise<any> {
        return Promise.resolve(parse5.parse(html));
    }

    public getHTMLindexResult(res: JSZip): Promise<string> {
        let folder = res.folder("rooms");
        let index = folder.file("index.htm");
        let prom: Promise<string>;
        prom = index.async("string");
        return prom;
    }

    public extractRoomsData(element: any, dataset: Dataset, zipObj: JSZip) {
        this.extractBuildingPaths(element);
        return this.getBuildingsHTMLresult(zipObj)
            .then((htmlStringArr: string[]) => {
                Log.trace("hi");
                return this.parseBuildingsHTML(htmlStringArr); })
            .then((parsedBuildings: any[]) => {
                this.parsedBuildings = parsedBuildings;
                return this.extractAllGeoLocation(parsedBuildings); })
            .then((geoLocDict: any[]) => {
                Log.trace("geo");
                return this.extractBuildingsDetails(this.parsedBuildings,
                    dataset, geoLocDict, this.geoBuildingNames); })
            .then((data: Dataset) => {
                return Promise.resolve(data);
            });
    }

    public extractAllGeoLocation(parsedBuildings: any[]) {
        let result: Array<Promise<any>> = [];
        parsedBuildings.forEach((parsedBuilding) => {
            let buildingAddress: string = RoomsHelper.findBuildingAddress(parsedBuilding);
            let buildingName: any = RoomsHelper.findBuildingName(parsedBuilding);
            try {
            const geoProm = this.retrieveGeoLocation(buildingAddress);
            result.push(geoProm);
            this.geoBuildingNames.push(buildingName);
            } catch (err) {
                Log.trace(err);
            }
        });
        return Promise.all(result);
    }

    public extractBuildingsDetails(parsedBuildings: any[], dataset: Dataset,
                                   geoLocDict: any[], buildingNamesWGeo: string[]) {
        let datasetloc: Dataset = dataset;
        for (let parsedBuilding of parsedBuildings) {
             let buildingAddress: string = RoomsHelper.findBuildingAddress(parsedBuilding);
             let buildingName: string = RoomsHelper.findBuildingName(parsedBuilding);
             if (buildingNamesWGeo.includes(buildingName)) {
                 Log.trace("hi");
                 this.dirtyRoomsTables = [];
                 RoomsHelper.findRoomsTables(parsedBuilding, this);
                 let tables = this.dirtyRoomsTables;
                 if (tables.length > 0) {
                     let building: Building = new Building();
                     let validRoomsTable = RoomsHelper.findValidRoomsTable(tables);
                     building = this.setAllRoomsContent(validRoomsTable, building,
                         buildingAddress, buildingName, geoLocDict, buildingNamesWGeo);
                     datasetloc.getBuildings().push(building);
                     Log.trace("lol");
                 }
             }
         }
        Log.trace("returning here");
        return Promise.resolve(datasetloc);
    }

    public retrieveGeoLocation(address: string): Promise<any> {
        let url: string = RoomsHelper.convertAddressToURL(address);
        const promise = new Promise((resolve, reject) => {
            http.get(url, (data: any) => {
                data.setEncoding("utf8");
                let rawData = "";
                // Log.trace("inside callback");
                let parsedData: any;
                data.on("data", (chunk: any) => {
                    rawData += chunk;
                });
                data.on("end", () => {
                    try {
                        parsedData = JSON.parse(rawData);
                        // Log.trace(parsedData);
                        return resolve(parsedData);
                    } catch (e) {
                        reject("rejecting");
                        //  Log.trace("error");
                    }
                });
            });
        });
        return promise;
    }

    public setAllRoomsContent(validRoomsTable: any, building: Building, buildingAddress: string,
                              buildingName: string, geoLocDict: any, buildingNamesWGeo: string[]) {
        let tbody: any = RoomsHelper.findRoomsTableBody(validRoomsTable);
        Log.trace("hi");
        this.dirtyRoomsRows = [];
        RoomsHelper.findRoomsRows(tbody, this);
        let roomsRows: any = this.dirtyRoomsRows;
        for (let row of roomsRows) {
            let room: Room = new Room();
            let link: string = RoomsHelper.findRoomLink(row);
            let roomNameNumber: string = RoomsHelper.extractRoomsNameOrNumber(link);
            let roomNameNumberArr: string[] = roomNameNumber.split("-");
            let roomName: string = roomNameNumberArr[0];
            let roomNumber: string = roomNameNumberArr[1];
            roomNameNumber = roomName + "_" + roomNumber;
            let roomSeats: number = RoomsHelper.findRoomsSeats(row);
            let roomFurnitureType: string = RoomsHelper.findRoomsFurnitureType(row);
            // Log.trace(roomFurnitureType);
            let roomType: string = RoomsHelper.findRoomsType(row);
            room.setAddress(buildingAddress);
            room.setFullname(buildingName);
            this.setGeoLocation(room, buildingName, geoLocDict, buildingNamesWGeo);
            room.setShortname(roomName);
            room.setName(roomNameNumber);
            room.setNumber(roomNumber);
            room.setSeats(roomSeats);
            room.setFurniture(roomFurnitureType);
            room.setType(roomType);
            room.setLink(link);
            building.listOfRooms.push(room);
        }
        return building;
    }

    public setGeoLocation(room: Room, buildingName: string, geoLocDict: any,
                          buildingNamesWGeo: string[]) {
        let index: number = buildingNamesWGeo.indexOf(buildingName);
        let latLon: any = geoLocDict[index];
        room.setLatLon(latLon);
    }

    public parseBuildingsHTML(htmlStringArr: string[]) {
        let parsedBuildings: any[] = [];
        for (let html of htmlStringArr) {
            parsedBuildings.push(parse5.parse(html));
        }
        return Promise.resolve(parsedBuildings);
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
        RoomsHelper.findTables(element, this);
        let listOfTables: any[] = this.buildingTableList;
        let validTable: any = RoomsHelper.findValidBuildingsTable(listOfTables);
        RoomsHelper.findBuildingPaths(validTable, this);
        let buildingPathList: string[] = RoomsHelper.removeRepeatedData(this.listBuildingPaths);

        for (let buildingPath of buildingPathList) {
            buildingPath = RoomsHelper.modifyBuildingPath(buildingPath);
            let buildingCode: string = RoomsHelper.extractRoomsNameOrNumber(buildingPath);
            this.buildingPathMap.set(buildingCode, buildingPath);
            Log.trace("hi");
        }
    }
}
