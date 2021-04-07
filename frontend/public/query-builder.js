/*
/!**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns querya object adhering to the query EBNF
 *!/
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
    let checkedCondValue;
    let queryWithWhereCond = query.WHERE;
    let conditionsContainer = coursesForm.querySelector(".conditions-container");


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
    let coursesColumnsKeys = ["audit", "avg", "dept", "uuid", "id", "instructor", "year", "fail", "pass", "title"];
    for (let input of columnsInputs) {
        if (input.checked) {
            let columnKey;
            if (!coursesColumnsKeys.includes(input.value)) {
                columnKey = input.value;
            } else {
                columnKey ="courses_" + input.value;
            }
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
            checkedGroupInput = "courses_" + input.value;
            groupArrKeys.push(checkedGroupInput);
        }
    }

    console.log(groupArrKeys);

    let transformation = coursesForm.querySelector(".transformations");
    let transformationContainer = transformation.querySelector(".transformations-container");
    transformationsObj["GROUP"] = groupArrKeys;
    if (transformationContainer.childElementCount !== 0) {
        let applyBlock = [];
        for (let transformation of transformationContainer.childNodes) {
            // operator ie SUM
            let transformationOperators = transformation.querySelector(".operators");
            let operatorOptions = transformationOperators.querySelectorAll("option");
            let operatorOptionVal = "";
            for (let option of operatorOptions) {
                if (option.selected) {
                    operatorOptionVal = option.value;
                }
            }
            console.log(operatorOptionVal);
            // field ie AVG
            let transformationFields = transformation.querySelector(".fields");
            let fieldOptions = transformationFields.querySelectorAll("option");
            let fieldOptionVal = "";
            for (let option of fieldOptions) {
                if (option.selected) {
                    fieldOptionVal = "courses_" + option.value;

                }
            }
            console.log(fieldOptionVal);

            // applyKey
            let transformationTerm = transformation.querySelector(".term");
            let termInput = transformationTerm.querySelector("input");
            let userInput = "";
            if (termInput.value) {
                userInput = termInput.value;
            }

            console.log(userInput);
            let innerApplyObj = {};
            innerApplyObj[operatorOptionVal] = fieldOptionVal;
            let applyRuleObj = {};
            applyRuleObj[userInput] = innerApplyObj;
            applyBlock.push(applyRuleObj);

        }

        console.log(applyBlock);

        transformationsObj["APPLY"] = applyBlock;
    }

    // handle columns here for the user val in trans

    if (!(transformationContainer.childElementCount === 0 && groupArrKeys.length === 0)) {
        query["TRANSFORMATIONS"] = transformationsObj
    }


    return query;
};
*/
