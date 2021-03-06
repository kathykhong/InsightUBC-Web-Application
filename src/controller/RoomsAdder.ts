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
import {BuildingsHelper} from "./BuildingsHelper";

const parse5 = require("parse5");

export class RoomsAdder {
    public indexBuildingtds: any[] = [];
    public indexBuildingRows: any[] = [];
    public indexBuildingNames: any[] = [];
    public indexBuildingAddresses: any[] = [];
    public dirtyBuildingTableHeaderThs: any[] = [];
    public dirtyRoomsTableHeaderThs: any [] = [];
    public dirtyRoomsTds: any[] = [];
    public dirtyRoomsRows: any[] = [];
    public dirtyRoomsTables: any[] = [];
    public buildingTableList: any[] = [];
    public listBuildingPaths: string[] = [];
    public buildingPathMap: Map<string, string> = new Map();
    public zip: JSZip;
    public parsedBuildings: any[];
    public geoBuildingNames: string[] = [];
    public roomsNumRows: number = 0;

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

    public extractRoomsData(parsedIndex: any, dataset: Dataset, zipObj: JSZip) {
        this.extractBuildingPaths(parsedIndex);
        RoomsHelper.extractBuildingAddresses(parsedIndex, this);
        // RoomsHelper.extractBuildingNames(parsedIndex, this);
        let names: string[] = this.indexBuildingNames;
        let addresses: string[] = this.indexBuildingAddresses;
        return this.getBuildingsHTMLresult(zipObj)
            .then((htmlStringArr: string[]) => {
                return this.parseBuildingsHTML(htmlStringArr);
            })
            .then((parsedBuildings: any[]) => {
                this.parsedBuildings = parsedBuildings;
                return this.extractAllGeoLocation(parsedBuildings, addresses);
            })
            .then((geoLocDict: any[]) => {
                return this.extractBuildingsDetails
                (this.parsedBuildings, dataset, geoLocDict, this.geoBuildingNames, addresses);
            })
            .then((data: Dataset) => {
                return Promise.resolve(data);
            });
    }

    public extractAllGeoLocation(parsedBuildings: any[], addresses: string[]) {
        let result: Array<Promise<any>> = [];
        parsedBuildings.forEach((parsedBuilding) => {
            let indexOfParsedBuilding: number = parsedBuildings.indexOf(parsedBuilding);
            let buildingAddress: string = addresses[indexOfParsedBuilding];
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
                                   geoLocDict: any[], buildingNamesWGeo: string[], addresses: string[]) {
        let datasetloc: Dataset = dataset;
        for (let parsedBuilding of parsedBuildings) {
            let indexOfParsedBuilding: number = parsedBuildings.indexOf(parsedBuilding);
            let buildingAddress: string = addresses[indexOfParsedBuilding];
            // let buildingAddress: string = RoomsHelper.findBuildingAddress(parsedBuilding);
            let buildingName: string = RoomsHelper.findBuildingName(parsedBuilding);
            if (buildingNamesWGeo.includes(buildingName)) {
                 this.dirtyRoomsTables = [];
                 RoomsHelper.findRoomsTables(parsedBuilding, this);
                 let tables = this.dirtyRoomsTables;
                 if (tables.length > 0) {
                     let building: Building = new Building();
                     let validRoomsTable = RoomsHelper.findValidRoomsTable(tables, this);
                     building = this.setAllRoomsContent(validRoomsTable, building,
                         buildingAddress, buildingName, geoLocDict, buildingNamesWGeo);
                     datasetloc.getBuildings().push(building);
                 }
             }
         }
        datasetloc.setNumRows(this.roomsNumRows);
        return Promise.resolve(datasetloc);
    }

    public retrieveGeoLocation(address: string): Promise<any> {
        let url: string = this.convertAddressToURL(address);
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
        this.dirtyRoomsRows = [];
        RoomsHelper.findRoomsRows(tbody, this);
        let roomsRows: any = this.dirtyRoomsRows;
        for (let row of roomsRows) {
            this.dirtyRoomsTds = [];
            RoomsHelper.findRoomRowTds(row, this);
            let room: Room = new Room();
            let link: string = RoomsHelper.findRoomLink(this.dirtyRoomsTds);
            let roomNameNumber: string = RoomsHelper.extractRoomsNameOrNumber(link); // "ALRD-505"
            let roomNameNumberArr: string[] = [];
            roomNameNumberArr = roomNameNumber.split("-"); // [ALRD, 505]
            let roomName: string = roomNameNumberArr[0]; // "ALRD"
            let roomNumber: string = roomNameNumberArr[1];
            roomNameNumber = roomName + "_" + roomNumber;
            let roomSeats: number = RoomsHelper.findRoomsSeats(this.dirtyRoomsTds);
            let roomFurnitureType: string = RoomsHelper.findRoomsFurnitureType(this.dirtyRoomsTds);
            // Log.trace(roomFurnitureType);
            let roomType: string = RoomsHelper.findRoomsType(this.dirtyRoomsTds);
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
            this.roomsNumRows = this.roomsNumRows + 1;
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
            } catch (err) {
                Log.trace(err);
            }
        }
        return Promise.all(result);
    }

    public extractBuildingPaths(element: any) {
        BuildingsHelper.findTables(element, this);
        let listOfTables: any[] = this.buildingTableList;
        let validTable: any = BuildingsHelper.findValidBuildingsTable(listOfTables, this);
        RoomsHelper.findBuildingPaths(validTable, this);
        let buildingPathList: string[] = RoomsHelper.removeRepeatedData(this.listBuildingPaths);

        for (let buildingPath of buildingPathList) {
            buildingPath = RoomsHelper.modifyBuildingPath(buildingPath);
            let buildingCode: string = RoomsHelper.extractRoomsNameOrNumber(buildingPath);
            this.buildingPathMap.set(buildingCode, buildingPath);
        }
    }

    public convertAddressToURL(address: string) {
        let baseURL: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team231/";
        let encodedAddress: string = encodeURI(address);
        let fullURL: string = baseURL + encodedAddress;
        return fullURL;
    }
}
