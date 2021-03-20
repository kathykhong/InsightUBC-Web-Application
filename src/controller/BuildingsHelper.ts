import {RoomsAdder} from "./RoomsAdder";
import {RoomsHelper} from "./RoomsHelper";

export class BuildingsHelper {
    public static findTables(element: any, roomsAdder: RoomsAdder): any {
        if (element.nodeName === "table") {
            roomsAdder.buildingTableList.push(element);
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                this.findTables(child, roomsAdder);
            }
        }
    }

    public static findBuildingsTableBody(table: any): any {
        if (table.nodeName === "tbody") {
            return table;
        }

        if (table.childNodes && table.childNodes.length > 0) {
            for (let child of table.childNodes) {
                let tbody: any = this.findBuildingsTableBody(child);
                if (!(tbody === undefined)) {
                    return this.findBuildingsTableBody(child);
                }
            }
        }
    }

    public static findBuildingTds(tableBody: any, roomsAdder: RoomsAdder) {
        if (tableBody.nodeName === "td" && tableBody.childNodes.length > 0) {
            roomsAdder.indexBuildingtds.push(tableBody);
        }

        if (tableBody.childNodes && tableBody.childNodes.length > 0) {
            for (let child of tableBody.childNodes) {
                this.findBuildingTds(child, roomsAdder);
            }
        }

    }

    public static findValidBuildingsTable(listOfTables: any, roomsAdder: RoomsAdder) {
        for (let table of listOfTables) {
            let tableHeader = RoomsHelper.findTableHeader(table);
            RoomsHelper.findBuildingTableHeaderThs(tableHeader, roomsAdder);
            let listThs: any[] = roomsAdder.dirtyBuildingTableHeaderThs;
            for (let th of listThs) {
                if (th.attrs && th.attrs.length > 0) {
                    for (let attr of th.attrs) {
                        if (attr.name === "class" && attr.value === "views-field views-field-field-building-image") {
                            return table;
                        }
                    }
                }
            }
        }
    }
}
