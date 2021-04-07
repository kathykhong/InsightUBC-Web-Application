/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = () => {
    let query = {};
    // TODO: implement!
    query["WHERE"] = {};

    // find data-type courses
    let coursesForm = document.querySelector('form[data-type = "courses"]');
    // coursesForm.getElementsByClassName("condition-type")[0]; - indexing attempt
    // there is a better way
    let conditionType = coursesForm.querySelector(".condition-type");

    let conditionOptions = conditionType.getElementsByTagName("input");
    for (let option of conditionOptions) {
        if (option.checked) {
            console.log(option.value);
        }
    }
    let conditionsObjs = [];
    // class = "conditions-container" but I just want the class obj and not a list
    // .conditions-conta
    let checkedCondValue;
    let queryWithWhereCond = query.WHERE;
    let conditions = coursesForm.querySelector(".condition")
    let conditionsContainer = conditions.querySelector(".conditions-container");


    // look for the checked option: all, any, nothing
    for (let option of conditionOptions) {
        if (option.checked) {
            checkedCondValue = option.value;
        }
    }
    // assign the query first level logic based on the checked condition
    if (checkedCondValue === "none") {
        if (conditionsContainer.childElementCount === 1) {
            query.WHERE = {"NOT": {}}
            queryWithWhereCond = query.WHERE.NOT;
        } else {
            query.WHERE = {"NOT": {"OR": []}};
            queryWithWhereCond = query.WHERE.NOT.OR;
        }
    }
    if (checkedCondValue === "all") {
        if (conditionsContainer.childElementCount !== 1) {
            query.WHERE = {"AND": []};
            queryWithWhereCond = query.WHERE.AND;
        }
    }
    if (checkedCondValue === "any") {
        if (conditionsContainer.childElementCount !== 1) {
            query.WHERE = {"OR": []};
            queryWithWhereCond = query.WHERE.OR;
        }
    }


    console.log(queryWithWhereCond);
    console.log(conditionsContainer);

    // assign query second level logic with the user input if any
    for (let condition of conditionsContainer.childNodes) {
        let fieldObj = {};
        let fieldObjKey = "";
        let userInputVal;
        let fields = condition.querySelector(".fields");
        let selectFields = fields.querySelector("select");
        for (let field of selectFields) {
            if (field.selected) {
                console.log(field.value);
                // e.g. courses_audit
                fieldObjKey = "courses_" + field.value;

            }
        }
        let term = condition.querySelector(".term");

        // userInputVal = term.getElementsByTagName("input") returns a collection :((
        let input = term.querySelector("input");
        userInputVal = input.value;
        console.log(userInputVal);
        // create field object ie {courses_audit: 97}
        fieldObj[fieldObjKey] = userInputVal;


        // create the filter object
        let filter = {};
        let operators = condition.querySelector(".operators");
        let selectOps = operators.querySelector("select");
        let notOption = condition.querySelector(".not");
        let notOptionInput = notOption.querySelector("input");
        for (let op of selectOps) {
            if (op.selected) {
                console.log(op.value);
                // set filter obj ie {GT: {courses_audit:97}}
                if (op.value === "EQ" || op.value === "LT" || op.value === "GT") {
                    fieldObj[fieldObjKey] = parseFloat(userInputVal);
                } else {
                    fieldObj[fieldObjKey] = userInputVal;
                }
                console.log(fieldObj);
                // encapsulate filter obj with not if needed

                console.log(filter);
                if (notOptionInput.checked) {
                    filter[op.value] = fieldObj;
                    if (conditionsContainer.childElementCount === 1) {
                        queryWithWhereCond["NOT"] = filter;
                    } else {
                        let notFilterObj = {};
                        notFilterObj["NOT"] = filter;
                        queryWithWhereCond.push(notFilterObj)
                    }
                } else {
                    if (conditionsContainer.childElementCount === 1) {
                        queryWithWhereCond[op.value] = fieldObj;
                    } else {
                        filter[op.value] = fieldObj;
                        queryWithWhereCond.push(filter);
                    }
                }
            }
        }
    }
    console.log(queryWithWhereCond);
    // create an OPTIONS empty columns first
    query["OPTIONS"] = {};
    query.OPTIONS["COLUMNS"] = [];
    let queryWithColumns = query.OPTIONS.COLUMNS;

    let columns = coursesForm.querySelector(".columns");
    let columnsInputs = columns.getElementsByTagName("input");

    // add all the checked options to columns
    for (let input of columnsInputs) {
        if (input.checked) {
            let columnKey = "courses_" + input.value;
            queryWithColumns.push(columnKey);
        }
    }
    console.log(queryWithColumns);
    console.log("CampusExplorer.buildQuery not implemented yet.");

    let order = coursesForm.querySelector(".order");
    let options = order.querySelectorAll("option");
    let descending = order.querySelector(".descending");
    let descendingInput = descending.querySelector("input");
    let highlightedOpt = "";
    let orderObj={};
    let dir = "";
    for (let option of options) {
        if (option.selected) {
            highlightedOpt = "courses_" + option.value.toLowerCase();
        }
    }
    if (descendingInput.checked) {
        dir = "DOWN";
    } else {
        dir = "UP";
    }

    orderObj["dir"] = dir;
    orderObj["keys"] = [];
    if (dir === "DOWN") {
        if (highlightedOpt !== "") {
            orderObj.keys.push(highlightedOpt);
        }
        query.OPTIONS["ORDER"] = orderObj;
    }
    if (dir === "UP") {
        // up and highlighted -> ORDER ; up and no highlight -> NO ORDER
        if (highlightedOpt !== "") {
            orderObj.keys.push(highlightedOpt);
            query.OPTIONS["ORDER"] = orderObj;
        }
    }

    let groups = coursesForm.querySelector(".groups");
    let groupsInputs = groups.querySelectorAll("input")
    let checkedGroupInput = "";
    let transformationsObj ={};
    let groupArrKeys = [];
    for (let input of groupsInputs) {
        if (input.checked) {
            let checkedGroupInput = "courses_" + input.value;
            groupArrKeys.push(checkedGroupInput);
        }
    }

    let transformation = coursesForm.querySelector(".transformations");
    let transformationContainer = transformation.querySelector(".transformations-container");
    if (transformationContainer.childElementCount === 0) {
        if (groupArrKeys.length !== 0) {
            transformationsObj["GROUP"] = groupArrKeys;
            query.WHERE["TRANSFORMATIONS"] = transformationsObj;
        }
    }
    if (transformationC)

    if (checkedGroupInput != "") {


    }




    return query;
};
