import {RoomsAdder} from "./RoomsAdder";
import Log from "../Util";

export class RoomsHelper {
    public static findTables(element: any, roomsAdder: RoomsAdder): any {
        if (element.nodeName === "table" && element.childNodes.length > 0 &&
            element.childNodes[1].nodeName === "thead") {
            roomsAdder.buildingTableList.push(element);
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                this.findTables(child, roomsAdder);
            }
        }
    }

    public static findValidBuildingsTable(listOfTables: any) {
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

    public static findBuildingPaths(validTableElement: any, roomsAdder: RoomsAdder) {
        if (validTableElement.nodeName === "a" && validTableElement.attrs.length > 0
            && validTableElement.attrs[0].name === "href") {
            let buildingPath: string = validTableElement.attrs[0].value;
            roomsAdder.listBuildingPaths.push(buildingPath);
        }
        if (validTableElement.childNodes && validTableElement.childNodes.length > 0) {
            for (let child of validTableElement.childNodes) {
                this.findBuildingPaths(child, roomsAdder);
            }
        }
    }

    public static removeRepeatedData(data: string[]) {
        let unique: string[] = [];
        data.forEach((element) => {
            if (!unique.includes(element)) {
                unique.push(element);
            }
        });
        return unique;
    }

    public static modifyBuildingPath(pathName: string) {
        pathName = pathName.substring(1);
        pathName = "rooms" + pathName;
        return pathName;
    }

    public static findRoomsTables(parsedBuilding: any, roomsAdder: RoomsAdder) {
        if (parsedBuilding.nodeName === "table" && parsedBuilding.childNodes.length > 0 &&
            parsedBuilding.childNodes[1].nodeName === "thead") {
            roomsAdder.dirtyRoomsTables.push(parsedBuilding);
        }
        if (parsedBuilding.childNodes && parsedBuilding.childNodes.length > 0) {
            for (let child of parsedBuilding.childNodes) {
                this.findRoomsTables(child, roomsAdder);
            }
        }
    }

    public static findValidRoomsTable(tables: any[]) {
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

    public static convertAddressToURL(address: string) {
        let baseURL: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team231/";
        let encodedAddress: string = encodeURI(address);
        let fullURL: string = baseURL + encodedAddress;
        return fullURL;
    }

    public static findBuildingBody(parsedBuildingElt: any): any {
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

    public static findRoomsRows(roomsTBodyElt: any, roomsAdder: RoomsAdder) {
        let roomsRow: any[] = [];
        if (roomsTBodyElt.nodeName === "tr" && roomsTBodyElt.childNodes.length > 0) {
            roomsAdder.dirtyRoomsRows.push(roomsTBodyElt);
        }
        if (roomsTBodyElt.childNodes && roomsTBodyElt.childNodes.length > 0) {
            for (let child of roomsTBodyElt.childNodes) {
                this.findRoomsRows(child, roomsAdder);
            }
        }
        return roomsRow;
    }

    public static findRoomsTableBody(roomsTBodyElt: any): any {
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

    public static findBuildingInfo(buildingBodyElt: any) {
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

    public static retrieveAddress(parsedBodyElt: any): string {
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

    public static extractRoomsNameOrNumber(buildingPath: string) {
        let pathSplitArr: string[] = buildingPath.split("/");
        let nameNumber = pathSplitArr[pathSplitArr.length - 1];
        return nameNumber;
    }

    public static findBuildingAddress(parsedBuilding: any) {
        let buildingBody: any = RoomsHelper.findBuildingBody(parsedBuilding);
        Log.trace("hi");
        let buildingInfo: any = RoomsHelper.findBuildingInfo(buildingBody);
        Log.trace("hi");
        let address: string = RoomsHelper.retrieveAddress(buildingInfo);
        return address;

    }

    public static retrieveBuildingName(buildingInfoElt: any) {
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

    public static findRoomLink(rowElt: any) {
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

    public static findRoomsSeats(rowElt: any): number {
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

    public static findRoomsType(rowElt: any) {
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

    public static findRoomsFurnitureType(rowElt: any): string {
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

    public static findBuildingName(parsedBuilding: any) {
        let buildingBody: any = RoomsHelper.findBuildingBody(parsedBuilding);
        Log.trace("hi");
        let buildingInfo: any = RoomsHelper.findBuildingInfo(buildingBody);
        Log.trace("hi");
        let name: string = RoomsHelper.retrieveBuildingName(buildingInfo);
        return name;
    }

}
