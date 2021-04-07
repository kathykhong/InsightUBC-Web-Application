import {Dataset} from "../dataModel/Dataset";
import {RoomsQueryProcessor} from "../queryModel/RoomsQueryProcessor";
import {QueryProcessor} from "../queryModel/QueryProcessor";
import {pre} from "restify";

export class PerformQueryHelper {

    public static breakAnyTies(query: any, resultObjects: any[]) {
        if (query.OPTIONS.ORDER.keys.length > 1) {
            let prevSortedArr: any[] = resultObjects;
            for (let i: number = 1; i < query.OPTIONS.ORDER.keys.length; i++) {
                let sortIndexStart: number = 0;
                let sortIndexEnd: number = 0;
                let dir: string = query.OPTIONS.ORDER.dir;
                let prevSortKey: string = query.OPTIONS.ORDER.keys[i - 1];
                let currSortKey: string = query.OPTIONS.ORDER.keys[i];
                let currSorted: any[] = [];
                for (let j: number = 1; j < prevSortedArr.length; j++) {
                    if (prevSortedArr[j][prevSortKey] !== prevSortedArr[j - 1][prevSortKey]) {
                        if (sortIndexStart === sortIndexEnd) {
                            sortIndexStart++;
                            sortIndexEnd++;
                            currSorted.push(prevSortedArr[j - 1]);
                        } else {
                            let preSorted: any[] = prevSortedArr;
                            let sortedSection: any[] = this.partialSort(preSorted, sortIndexStart,
                                sortIndexEnd, currSortKey, dir);
                            this.addSortedSegmentToCurrSorted(sortedSection, currSorted);
                            sortIndexStart = j;
                            sortIndexEnd = j;
                        }
                    }
                    if (prevSortedArr[j][prevSortKey] === prevSortedArr[j - 1][prevSortKey]) {
                        if (sortIndexStart === sortIndexEnd) {
                            sortIndexStart = j - 1;
                            sortIndexEnd = j;
                        } else {
                            sortIndexEnd = j;
                        }
                    }
                }
                if (prevSortedArr[prevSortedArr.length - 1][prevSortKey] ===
                    prevSortedArr[prevSortedArr.length - 2][prevSortKey]) {
                    let lastSortSec = this.partialSort(prevSortedArr, sortIndexStart,
                        sortIndexEnd, currSortKey, dir);
                    this.addSortedSegmentToCurrSorted(lastSortSec, currSorted);
                } else {
                    currSorted.push(prevSortedArr[prevSortedArr.length - 1]);
                }
                prevSortedArr = currSorted;
            }
            return prevSortedArr;
        }
    }

    public static partialSort(arr: any[], start: number, end: number, sortKey: string, dir: string ) {
        let preSorted: any[] = [];
        for (let i: number = start; i <= end; i++) {
            preSorted.push(arr[i]);
        }
        this.doSort(preSorted, dir, sortKey);
        return preSorted;
    }

    public static roomsQueryProcessorHelper(dataset: Dataset, rqp: RoomsQueryProcessor, query: any,
                                            resultSectionorRoomObjects: any[]) {
        for (const building of dataset.getBuildings()) {
            for (const room of building.getListOfRooms()) {
                if (rqp.checkFilterCondMet(room, query.WHERE)) {
                    resultSectionorRoomObjects.push(room); // resultSectionorRoomObjects is EMPTY
                }
            }
        }
    }

    public static coursesQueryProcessorHelper(dataset: Dataset, qp: QueryProcessor, query: any,
                                              resultSectionorRoomObjects: any[]) {
        for (const course of dataset.getCourses().values()) {
            for (const section of course.getSections()) {
                if (qp.checkFilterCondMet(section, query.WHERE)) {
                    resultSectionorRoomObjects.push(section);
                }
            }
        }
    }

    public static doSort(resultObjects: any[], dir: string, sortKey: string) {
        if (dir === "DOWN") {
            resultObjects.sort((a, b) => {
                if (a[sortKey] > b[sortKey]) {
                    return -1;
                }
                if (a[sortKey] < b[sortKey]) {
                    return 1;
                }
                return 0;
            });
        }

        if (dir === "UP") {
            resultObjects.sort((a, b) => {
                if (a[sortKey] < b[sortKey]) {
                    return -1;
                }
                if (a[sortKey] > b[sortKey]) {
                    return 1;
                }
                return 0;
            });
        }
    }

    public static sortResults(query: any, resultObjects: any[]) {
        if (Object.keys(query.OPTIONS).length === 2) {
            let argSort: any = query.OPTIONS.ORDER;
            if (typeof argSort === "string") {
                PerformQueryHelper.doSort(resultObjects, "UP", argSort);
                return resultObjects;
            }
            if (typeof argSort === "object") {
                let sortKey: string = query.OPTIONS.ORDER.keys[0];
                PerformQueryHelper.doSort(resultObjects, query.OPTIONS.ORDER.dir, sortKey);
                let sortedArr: any[] = PerformQueryHelper.breakAnyTies(query, resultObjects);
                return sortedArr;
            }
        } else {
            return resultObjects;
        }
    }

    public static addSortedSegmentToCurrSorted(sortedSection: any[], currSorted: any[]) {
        for (const elt of sortedSection) {
            currSorted.push(elt);
        }
    }
}
