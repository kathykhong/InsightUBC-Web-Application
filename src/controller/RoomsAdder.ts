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

const parse5 = require("parse5");

export class RoomsAdder {

    public dirtyRoomsRows: any[] = [];
    public dirtyRoomsTables: any[] = [];
    public buildingTableList: any[] = [];
    public listBuildingPaths: string[] = [];
    public buildingPathMap: Map<string, string> = new Map();
    public zip: JSZip;
    public parsedBuildings: any[];
    public geoLocationList: any[] = [];
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
                return this.getHTMLresult(res);
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

    public getHTMLresult(res: JSZip): Promise<string> {
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
            let buildingAddress: string = this.findBuildingAddress(parsedBuilding);
            let buildingName: any = this.findBuildingName(parsedBuilding);
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
             let buildingAddress: string = this.findBuildingAddress(parsedBuilding);
             let buildingName: string = this.findBuildingName(parsedBuilding);
             if (buildingNamesWGeo.includes(buildingName)) {
                 Log.trace("hi");
                 this.dirtyRoomsTables = [];
                 this.findRoomsTables(parsedBuilding);
                 let tables = this.dirtyRoomsTables;
                 if (tables.length > 0) {
                     let building: Building = new Building();
                     let validRoomsTable = this.findValidRoomsTable(tables);
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
        let tbody: any = this.findRoomsTableBody(validRoomsTable);
        Log.trace("hi");
        this.dirtyRoomsRows = [];
        this.findRoomsRows(tbody);
        let roomsRows: any = this.dirtyRoomsRows;
        for (let row of roomsRows) {
            let room: Room = new Room();
            let link: string = this.findRoomLink(row);
            let roomNameNumber: string = this.extractRoomsNameOrNumber(link);
            let roomNameNumberArr: string[] = roomNameNumber.split("-");
            let roomName: string = roomNameNumberArr[0];
            let roomNumber: string = roomNameNumberArr[1];
            roomNameNumber = roomName + "_" + roomNumber;
            let roomSeats: number = this.findRoomsSeats(row);
            let roomFurnitureType: string = this.findRoomsFurnitureType(row);
            // Log.trace(roomFurnitureType);
            let roomType: string = this.findRoomsType(row);
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

    public findRoomsType(rowElt: any) {
        if (rowElt.childNodes[7].nodeName === "td" && rowElt.childNodes[7].attrs.length > 0
            && rowElt.childNodes[7].attrs[0].value === "views-field views-field-field-room-type") {
            let roomsTypeTDContent: any = rowElt.childNodes[7];
            if (roomsTypeTDContent.childNodes[0].nodeName === "#text") {
                let roomsType: string = roomsTypeTDContent.childNodes[0].value;
                roomsType = roomsType.trim();
                return roomsType;
            }
        }
    }

    public findRoomsFurnitureType(rowElt: any): string {
        if (rowElt.childNodes[5].nodeName === "td" && rowElt.childNodes[5].attrs.length > 0
            && rowElt.childNodes[5].attrs[0].value === "views-field views-field-field-room-furniture") {
            let furnitureTypeTDContent: any = rowElt.childNodes[5];
            if (furnitureTypeTDContent.childNodes[0].nodeName === "#text") {
                let furnitureType: string = furnitureTypeTDContent.childNodes[0].value;
                furnitureType = furnitureType.trim();
                return furnitureType;
            }
        }
    }

    public findRoomsSeats(rowElt: any): number {
        if (rowElt.childNodes[3].nodeName === "td" && rowElt.childNodes[3].attrs.length > 0
            && rowElt.childNodes[3].attrs[0].value === "views-field views-field-field-room-capacity") {
            let seatTDContent: any = rowElt.childNodes[3];
            if (seatTDContent.childNodes[0].nodeName === "#text") {
                let seatNumberStr: string = seatTDContent.childNodes[0].value;
                seatNumberStr = seatNumberStr.trim();
                let seatNumber: number = Number(seatNumberStr);
                return seatNumber;
            }
        }


    }

    public findRoomLink(rowElt: any) {
        if (rowElt.childNodes[1].nodeName === "td" && rowElt.childNodes[1].attrs.length > 0
            && rowElt.childNodes[1].attrs[0].value === "views-field views-field-field-room-number") {
            let linkTDContent: any = rowElt.childNodes[1];

            if (linkTDContent.childNodes[1].nodeName === "a" && linkTDContent.childNodes[1].attrs.length > 0
                && linkTDContent.childNodes[1].attrs[0].name === "href") {
                let roomLink: string = linkTDContent.childNodes[1].attrs[0].value;
                return roomLink;
            }
        }
    }

    public findRoomsTableBody(roomsTBodyElt: any): any {
        if (roomsTBodyElt.nodeName === "tbody") {
            return roomsTBodyElt;
        }

        if (roomsTBodyElt.childNodes && roomsTBodyElt.childNodes.length > 0) {
            for (let child of roomsTBodyElt.childNodes) {
                let tbody: any = this.findRoomsTableBody(child);
                if (!(tbody === undefined)) {
                    return this.findRoomsTableBody(child);
                }
            }
        }
    }

    public findRoomsRows(roomsTBodyElt: any) {
        let roomsRow: any[] = [];
        if (roomsTBodyElt.nodeName === "tr" && roomsTBodyElt.childNodes.length > 0) {
            this.dirtyRoomsRows.push(roomsTBodyElt);
        }
        if (roomsTBodyElt.childNodes && roomsTBodyElt.childNodes.length > 0) {
            for (let child of roomsTBodyElt.childNodes) {
                this.findRoomsRows(child);
            }
        }

        return roomsRow;
    }

    public findBuildingName(parsedBuilding: any) {
        let buildingBody: any = this.findBuildingBody(parsedBuilding);
        Log.trace("hi");
        let buildingInfo: any = this.findBuildingInfo(buildingBody);
        Log.trace("hi");
        let name: string = this.retrieveBuildingName(buildingInfo);
        return name;
    }

    public retrieveBuildingName(buildingInfoElt: any) {
        if (buildingInfoElt.childNodes[1].nodeName === "h2") {
            let subheader: any = buildingInfoElt.childNodes[1];
            if (subheader.childNodes[0].nodeName === "span") {
                let span: any = subheader.childNodes[0];
                if (span.childNodes[0].nodeName === "#text") {
                    let buildingName: string = span.childNodes[0].value;
                    return buildingName;
                }
            }
        }
    }

    public findBuildingAddress(parsedBuilding: any) {
        let buildingBody: any = this.findBuildingBody(parsedBuilding);
        Log.trace("hi");
        let buildingInfo: any = this.findBuildingInfo(buildingBody);
        Log.trace("hi");
        let address: string = this.retrieveAddress(buildingInfo);
        return address;

    }

    public findBuildingInfo(buildingBodyElt: any) {
        if (buildingBodyElt.nodeName === "div" && buildingBodyElt.attrs !== undefined
            && buildingBodyElt.attrs[0].value === "building-info") {
            return buildingBodyElt;
        }
        if (buildingBodyElt.childNodes && buildingBodyElt.childNodes.length > 0) {
            for (let child of buildingBodyElt.childNodes) {
                let buildingInfo: any = this.findBuildingInfo(child);
                if (!(buildingInfo === undefined)) {
                    return buildingInfo;
                }
            }
        }
    }


    public retrieveAddress(parsedBodyElt: any): string {
        if (parsedBodyElt.childNodes[3].nodeName === "div"
            && parsedBodyElt.childNodes[3].attrs[0].value === "building-field") {
            let firstDivElt = parsedBodyElt.childNodes[3];
            if (firstDivElt.childNodes[0].nodeName === "div"
                && firstDivElt.childNodes[0].attrs[0].value === "field-content") {
                let innerDivFieldContent = firstDivElt.childNodes[0];
                if (innerDivFieldContent.childNodes[0].nodeName === "#text") {
                    let buildingAddress: string = innerDivFieldContent.childNodes[0].value;
                    return buildingAddress;
                }
            }
        }
    }

    public findBuildingBody(parsedBuildingElt: any): any {
        if (parsedBuildingElt.nodeName === "body"
            && parsedBuildingElt.childNodes !== undefined && parsedBuildingElt.childNodes.length > 0
            && parsedBuildingElt.childNodes[1].nodeName === "noscript") {
            return parsedBuildingElt;
        }
        if (parsedBuildingElt.childNodes && parsedBuildingElt.childNodes.length > 0) {
            for (let child of parsedBuildingElt.childNodes) {
                let body: any = this.findBuildingBody(child);
                if (!(body === undefined)) {
                    return body;
                }
            }
        }
    }

    public convertAddressToURL(address: string) {
        let baseURL: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team231/";
        let encodedAddress: string = encodeURI(address);
        let fullURL: string = baseURL + encodedAddress;
        return fullURL;
    }

    public findValidRoomsTable(tables: any[]) {
        for (let table of tables) {
            let tableHeader = table.childNodes[1];
            if (tableHeader.childNodes[1].nodeName === "tr") {
                let headerRows = tableHeader.childNodes[1];

                if (headerRows.childNodes[1].nodeName === "th") {
                    let tableHeading = headerRows.childNodes[1];
                    if (tableHeading.attrs.length > 0
                        && tableHeading.attrs[0].value === "views-field views-field-field-room-number") {
                        return table;
                    }
                }
            }
        }
    }


    public findRoomsTables(parsedBuilding: any) {
        if (parsedBuilding.nodeName === "table" && parsedBuilding.childNodes.length > 0 &&
            parsedBuilding.childNodes[1].nodeName === "thead") {
            this.dirtyRoomsTables.push(parsedBuilding);
        }
        if (parsedBuilding.childNodes && parsedBuilding.childNodes.length > 0) {
            for (let child of parsedBuilding.childNodes) {
                this.findRoomsTables(child);
            }
        }
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
        this.findTables(element);
        let listOfTables: any[] = this.buildingTableList;
        let validTable: any = this.findValidBuildingsTable(listOfTables);
        this.findBuildingPaths(validTable);
        let buildingPathList: string[] = this.removeRepeatedData(this.listBuildingPaths);

        for (let buildingPath of buildingPathList) {
            buildingPath = this.modifyBuildingPath(buildingPath);
            let buildingCode: string = this.extractRoomsNameOrNumber(buildingPath);
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

    public extractRoomsNameOrNumber(buildingPath: string) {
        let pathSplitArr: string[] = buildingPath.split("/");
        let nameNumber = pathSplitArr[pathSplitArr.length - 1];
        return nameNumber;
    }

    public findBuildingPaths(validTableElement: any) {
        if (validTableElement.nodeName === "a" && validTableElement.attrs.length > 0
            && validTableElement.attrs[0].name === "href") {
            let buildingPath: string = validTableElement.attrs[0].value;
            this.listBuildingPaths.push(buildingPath);
        }
        if (validTableElement.childNodes && validTableElement.childNodes.length > 0) {
            for (let child of validTableElement.childNodes) {
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
                        && tableHeading.attrs[0].value === "views-field views-field-field-building-image") {
                        return table;
                    }
                }
            }
        }
    }

    public findTables(element: any): any {
        if (element.nodeName === "table" && element.childNodes.length > 0 &&
            element.childNodes[1].nodeName === "thead") {
            this.buildingTableList.push(element);
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                this.findTables(child);
            }
        }
    }


}
