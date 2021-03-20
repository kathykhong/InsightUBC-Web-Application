import {RoomsAdder} from "./RoomsAdder";
import {Room} from "../dataModel/Room";
import {BuildingsHelper} from "./BuildingsHelper";

export class RoomsHelper {
    public static findRoomsTables(element: any, roomsAdder: RoomsAdder): any {
        if (element.nodeName === "table") {
            roomsAdder.dirtyRoomsTables.push(element);
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                this.findRoomsTables(child, roomsAdder);
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

    public static findValidRoomsTable(tables: any[], roomsAdder: RoomsAdder) {
        for (let table of tables) {
            let tableHeader = this.findTableHeader(table);
            this.findRoomsTableHeaderThs(tableHeader, roomsAdder);
            let listThs: any[] = roomsAdder.dirtyRoomsTableHeaderThs;
            for (let th of listThs) {
                if (th.attrs && th.attrs.length > 0) {
                    for (let attr of th.attrs) {
                        if (attr.name === "class" && attr.value === "views-field views-field-field-room-number") {
                            return table;
                        }
                    }
                }
            }
        }
    }

    public static findRoomsTableHeaderThs(theadElt: any, roomsAdder: RoomsAdder) {
        if (theadElt.nodeName === "th") {
            roomsAdder.dirtyRoomsTableHeaderThs.push(theadElt);
        }

        if (theadElt.childNodes && theadElt.childNodes.length > 0) {
            for (let child of theadElt.childNodes) {
                this.findRoomsTableHeaderThs(child, roomsAdder);
            }
        }
    }

    public static findBuildingTableHeaderThs(theadElt: any, roomsAdder: RoomsAdder) {
        if (theadElt.nodeName === "th") {
            roomsAdder.dirtyBuildingTableHeaderThs.push(theadElt);
        }

        if (theadElt.childNodes && theadElt.childNodes.length > 0) {
            for (let child of theadElt.childNodes) {
                this.findBuildingTableHeaderThs(child, roomsAdder);
            }
        }
    }

    public static findTableHeader(tableElt: any) {
        if (tableElt.nodeName === "thead") {
            return tableElt;
        }

        if (tableElt.childNodes && tableElt.childNodes.length > 0) {
            for (let child of tableElt.childNodes) {
                let thead: any = this.findTableHeader(child);
                if (!(thead === undefined)) {
                    return thead;
                }
            }
        }
    }

    public static findRoomRowTds(roomsTBodyElt: any, roomsAdder: RoomsAdder) {
        if (roomsTBodyElt.nodeName === "td" && roomsTBodyElt.childNodes.length > 0) {
            roomsAdder.dirtyRoomsTds.push(roomsTBodyElt);
        }

        if (roomsTBodyElt.childNodes && roomsTBodyElt.childNodes.length > 0) {
            for (let child of roomsTBodyElt.childNodes) {
                this.findRoomRowTds(child, roomsAdder);
            }
        }

    }

    public static findRoomsRows(roomsTBodyElt: any, roomsAdder: RoomsAdder) {
        if (roomsTBodyElt.nodeName === "tr" && roomsTBodyElt.childNodes.length > 0) {
            roomsAdder.dirtyRoomsRows.push(roomsTBodyElt);
        }
        if (roomsTBodyElt.childNodes && roomsTBodyElt.childNodes.length > 0) {
            for (let child of roomsTBodyElt.childNodes) {
                this.findRoomsRows(child, roomsAdder);
            }
        }
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

    public static findBuildingInfo(parsedBuildingElt: any) {
        if (parsedBuildingElt.nodeName === "div" && parsedBuildingElt.attrs) {
            for (let attr of parsedBuildingElt.attrs) {
                if (attr.name === "id" && attr.value === "building-info") {
                    return parsedBuildingElt;
                }
            }
        }

        if (parsedBuildingElt.childNodes && parsedBuildingElt.childNodes.length > 0) {
            for (let child of parsedBuildingElt.childNodes) {
                let buildingInfo: any = this.findBuildingInfo(child);
                if (!(buildingInfo === undefined)) {
                    return buildingInfo;
                }
            }
        }
    }

    public static retrieveAddress(buildingInfo: any): string {
        if (buildingInfo.childNodes[3].nodeName === "div"
            && buildingInfo.childNodes[3].attrs[0].value === "building-field") {
            let firstDivElt = buildingInfo.childNodes[3];
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

    public static extractBuildingAddresses(parsedIndex: any, roomsAdder: RoomsAdder) {
        roomsAdder.buildingTableList = [];
        BuildingsHelper.findTables(parsedIndex, roomsAdder);
        let listOfTables: any[] = roomsAdder.buildingTableList;
        let validTable: any = BuildingsHelper.findValidBuildingsTable(listOfTables, roomsAdder);
        let tableBody: any = BuildingsHelper.findBuildingsTableBody(validTable);
        BuildingsHelper.findBuildingTds(tableBody, roomsAdder);
        this.findBuildingAddress(roomsAdder.indexBuildingtds, roomsAdder);
    }

    public static findBuildingName(parsedBuilding: any) {
        let buildingInfo: any = RoomsHelper.findBuildingInfo(parsedBuilding);
        let name: string = RoomsHelper.retrieveBuildingName(buildingInfo);
        return name;
    }

    public static findBuildingAddress(buildingTds: any[], roomsAdder: RoomsAdder) {
        for (let td of buildingTds) {
            if (td.attrs.length > 0 && td.childNodes) {
                for (let tdAttr of td.attrs) {
                    if (tdAttr.name === "class" && tdAttr.value === "views-field views-field-field-building-address") {
                        for (let child of td.childNodes) {
                            if (child.nodeName === "#text") {
                                let address: string = child.value;
                                address = address.trim();
                                roomsAdder.indexBuildingAddresses.push(address);
                            }
                        }
                    }
                }
            }
        }
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

    public static findRoomLink(rowtdArr: any[]) {
        for (let td of rowtdArr) {
            if (td.attrs.length > 0 && td.childNodes) {
                for (let tdAttrs of td.attrs) {
                    if (tdAttrs.name === "class" && tdAttrs.value === "views-field views-field-field-room-number") {
                        for (let child of td.childNodes) {
                            if (child.nodeName === "a" && child.attrs && child.attrs.length > 0) {
                                for (let attr of child.attrs) {
                                    if (attr.name === "href") {
                                        let roomLink: string = child.attrs[0].value;
                                        return roomLink;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    public static findRoomsSeats(rowtdArr: any): number {
        for (let td of rowtdArr) {
            if (td.attrs.length > 0 && td.childNodes) {
                for (let attr of td.attrs) {
                    if (attr.name === "class" && attr.value === "views-field views-field-field-room-capacity") {
                        for (let child of td.childNodes) {
                            if (child.nodeName === "#text") {
                                let roomCapacity: number = child.value;
                                return roomCapacity;
                            }
                        }
                    }
                }
            }
        }
    }

    public static findRoomsType(rowtdArr: any) {
        for (let td of rowtdArr) {
            if (td.attrs.length > 0 && td.childNodes) {
                for (let attr of td.attrs) {
                    if (attr.name === "class" && attr.value === "views-field views-field-field-room-type") {
                        for (let child of td.childNodes) {
                            if (child.nodeName === "#text") {
                                let type: string = child.value;
                                return type;
                            }
                        }
                    }
                }
            }
        }
    }

    public static findRoomsFurnitureType(rowtdArr: any): string {
        for (let td of rowtdArr) {
            if (td.attrs.length > 0 && td.childNodes) {
                for (let attr of td.attrs) {
                    if (attr.name === "class" && attr.value === "views-field views-field-field-room-furniture") {
                        for (let child of td.childNodes) {
                            if (child.nodeName === "#text") {
                                let furnitureType: string = child.value;
                                return furnitureType;
                            }
                        }
                    }
                }
            }
        }
    }
}
