import {Dataset} from "../dataModel/Dataset";
import {RoomsQueryProcessor} from "../queryModel/RoomsQueryProcessor";
import {QueryProcessor} from "../queryModel/QueryProcessor";

export class PerformQueryHelper {

    public static breakAnyTies(query: any, resultObjects: any[]) {
        if (query.OPTIONS.ORDER.keys.length > 1) {
            for (let i: number = 1; i < query.OPTIONS.ORDER.keys.length; i++) {
                let prevSortKey: string = query.OPTIONS.ORDER.keys[i - 1];
                let currSortKey: string = query.OPTIONS.ORDER.keys[i];
                for (let j: number = 1; j < resultObjects.length; j++) {
                    if (resultObjects[j][prevSortKey] === resultObjects[j - 1][prevSortKey]) {
                        if (query.OPTIONS.ORDER.dir === "DOWN") {
                            if (resultObjects[j][currSortKey] > resultObjects[j - 1][currSortKey]) {
                                let temp: any = resultObjects[j];
                                resultObjects[j] = resultObjects[j - 1];
                                resultObjects[j - 1] = temp;
                            }
                        }
                        if (query.OPTIONS.ORDER.dir === "UP") {
                            if (resultObjects[j][currSortKey] < resultObjects[j - 1][currSortKey]) {
                                let temp: any = resultObjects[j];
                                resultObjects[j] = resultObjects[j - 1];
                                resultObjects[j - 1] = temp;
                            }
                        }
                    }
                }
            }
        }
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
}
