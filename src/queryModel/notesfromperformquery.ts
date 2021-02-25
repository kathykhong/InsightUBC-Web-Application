// todo: call validate filter on each (type checking key:val pairs)
/*

public handleFilter() {
    switch:
        case: "AND" {
            // for each Object.keys inside this AND sub-object, recurse handleFilter(sub-subobject)
            [] to store Object.keys(this AND layer) todo: does this act like a queue
            [] to store true/false values for every recursive call or just call "leaf helpers"
            check [bool] for final return value for this layer
            processing: for each recursive call, pass in the filtered dataset
            todo: ash's big question is still how we keep track of what layer we're on
        }
        case: "OR"{
            // for each Object.keys inside this AND sub-object, recurse handleFilter(sub-subobject)
        }
        case: "NOT"
    // single case ones are based objects
        // do the filtering with the dataset
        case: "LT"
    // do the filtering with the dataset
        case: "GT"
        case: "EQ"
        case: "IS"
        default:
}

containsStrictlyOneUnderscore(idKey: string): boolean
- check that the datasetid_field only has one underscore
- if it contains more than one underscore, or no underscore, automatically invalid key type
*/
