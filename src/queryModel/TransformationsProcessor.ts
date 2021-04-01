import {Section} from "../dataModel/Section";
import {QueryValidator} from "./QueryValidator";
import {Dataset} from "../dataModel/Dataset";
import {AnykeyHandler} from "./AnykeyHandler";

export class TransformationsProcessor {
    // handle GROUP
    public static handleGroup(query: any, validator: QueryValidator, resultSectionorRoomObjects: any[],
                              dataset: Dataset) {
        let grouparr = query.TRANSFORMATIONS.GROUP;
        // split grouparr elts into just keys (rn could be courses_title)
        for (let i: number = 0; i < grouparr.length; i++) {
            if (grouparr[i].includes("_")) {
                let currIDKeyArr = validator.splitIDKey(grouparr[i]);
                grouparr[i] = currIDKeyArr[1];
            }
        }

        /*
        * first map: empty key : resultssectionObjects[Section, Sections, ...]
        * for each key in above map, grab the array. for this array, do a grouping, and add sections to the
        * array (value) of the next map's key corresponding to this groupKey
        * map(2) : groupKey1Val1 : [SectionforVal1, SectionforVal1,], groupKey1Val2: [Section, Section]
        *
        * */
        let prevGroups: Map<string, any[]> = new Map();
        prevGroups.set("", resultSectionorRoomObjects);
        for (const groupKey of grouparr) {
            let currGroup: Map<string, any[]> = new Map();
            let prevGroupKeys: any = prevGroups.keys();
            for (const prevKey of prevGroupKeys) {
                let subGroupArr: any[] = prevGroups.get(prevKey);
                for (const section of subGroupArr) {
                    let potentialNewKey: string = prevKey + ";" + section.getArg(groupKey);
                    if (!currGroup.has(potentialNewKey)) {
                        let newGroupKey: string = prevKey + ";" + section.getArg(groupKey);
                        let newSectionArray: any[] = [];
                        newSectionArray.push(section);
                        currGroup.set(newGroupKey, newSectionArray);
                    } else {
                        currGroup.get(potentialNewKey).push(section);
                    }
                }
            }
            prevGroups = currGroup;
        }
        // prevGroups now holds all sub groups in a map (310;elisa: [Sections] ...)

        // {
        //                     "overallAvg": {
        //                         "AVG": "courses_avg"
        //                     }
        //                 }
        // handle APPLY
        // APPLY's value, an arr, can be empty. if so, do nothing
        if (query.TRANSFORMATIONS.APPLY.length !== 0) {
            for (const applyRule of query.TRANSFORMATIONS.APPLY) {
                let applyKey: string = Object.keys(applyRule)[0]; // overallAvg
                let applyTokenObject: string = applyRule[applyKey];
                // {AVG:c "courses_avg}
                let applyToken: string = Object.keys(applyTokenObject)[0]; // AVG
                let mskey: any = Object.values(applyTokenObject)[0]; // courses_avg
                let currIDKeyArr = validator.splitIDKey(mskey);
                mskey = currIDKeyArr[1]; // avg

                for (const group of prevGroups.values()) {
                    AnykeyHandler.doApply(group, applyKey, applyToken, mskey);
                }
            }
        }
        return prevGroups;
    }
}
