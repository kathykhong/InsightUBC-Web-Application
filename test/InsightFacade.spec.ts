import * as chai from "chai";
import { expect } from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import {
    InsightDataset,
    InsightDatasetKind,
    InsightError,
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import { NotFoundError } from "restify";

// This extends chai with assertions that natively support Promises
chai.use(chaiAsPromised);

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    // like a dictionary, key(id:string) :val(string, path to file)
    // use these to test the content for addDataset
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        courses1: "./test/data/courses.zip",
        courses2: "./test/data/courses2.zip",
        courses3: "./test/data/courses2.zip", // adding duplicate
        coursesWhitespace: "./test/data/    .zip",
        coursesBeginWithWhitespace: "./test/data/ courses.zip",
        coursesEndWithWhitespace: "./test/data/courses .zip",
        coursesContainWhitespace: "./test/data/cour ses.zip",
        coursesBeingWithUnderscore: "./test/data/_courses.zip",
        coursesEndWithUnderscore: "./test/data/courses_.zip",
        coursesContainUnderscore: "./test/data/cour_ses.zip",
        emptyDataset: "./test/data/emptydataset.zip",
        zoolOnly36results: "./test/data/zoolOnly36results.zip",
        nestOnly82results: "./test/data/nestOnly82results.zip",
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";
    //
    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    // making a new branch test***
    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should not add a dataset with only whitespace id", function () {
        const id: string = "    "; // 4 spaces
        const expected: string[] = [];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"], // we only want to validate id input
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.rejectedWith(InsightError);
    });

    it("Should not add a dataset with only whitespace id in content param", function () {
        const id: string = "courses"; // 4 spaces
        const expected: string[] = [];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["coursesWhitespace"], // we only want to validate id input
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.rejectedWith(InsightError);
    });

    it("Should add a dataset with id begin with whitespace", function () {
        const id: string = " courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add a dataset with content id begin with whitespace", function () {
        const id: string = " courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    it("Should add a dataset with id end with whitespace", function () {
        const id: string = "courses ";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    // it("Should add a dataset with content id end with whitespace", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets["coursesEndWithWhitespace"],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.deep.equal(expected);
    // });

    it("Should add a dataset with id containing whitespace", function () {
        const id: string = "cour ses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    // it("Should add a dataset with content id containing whitespace", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets["coursesContainWhitespace"],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.deep.equal(expected);
    // });

    // chaining to error
    it("Should not add a dataset with repeated id", function () {
        const id1: string = "courses";
        const expected: string[] = [id1];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.eventually.deep.equal(expected)
            .then(() => {
                // next function call here
                const futureResult2: Promise<
                    string[]
                > = insightFacade.addDataset(
                    id1,
                    datasets[id1],
                    InsightDatasetKind.Courses,
                );
                // we are expecting it to fail so (Y)
                return expect(futureResult2).to.eventually.be.rejectedWith(
                    InsightError,
                );
            });
    });

    // catch:
    // expect to equal some expected result, in catch, if it fails, thats bad
    // for identifying what error (useful in a chain)

    it("Should not add a dataset with no id", function () {
        const id: string = "";
        const expected: string[] = []; // input is invalid specs says throw an ERROR
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
        // this should error if any of the inputs are invalid
    });

    it("Should not add a dataset with id starting with underscore", function () {
        const id: string = "_courses";
        const expected: string[] = [];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should not add a dataset with id ending with underscore", function () {
        const id: string = "courses_";
        const expected: string[] = [];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should not add a dataset with id containing underscore", function () {
        const id: string = "cour_ses";
        const expected: string[] = [];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets["courses"],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });
    /*
        it("Should not add a dataset with id too large", function () {
            const id: string = "courses";
            const expected: string[] = [id];
            const futureResult: Promise<string[]> = insightFacade.addDataset(
                id,
                datasets[id],
                InsightDatasetKind.Courses,
            );
            return expect(futureResult).to.eventually.deep.equal(expected);
        });
    */

    it("Should not add a dataset with kind = rooms", function () {
        const id: string = "courses";
        const expected: string[] = [];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    });

    it("Should add a dataset with kind = courses", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult).to.eventually.deep.equal(expected);
    });

    // TESTS: removeDataset

    it("Should not remove a dataset with only whitespace id", function () {
        const id: string = "    "; // 4 spaces
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.eventually.rejectedWith(InsightError);
    });

    it("Should not remove a dataset from an empty list", function () {
        const id: string = "courses"; // 4 spaces
        const futureResult: Promise<string> = insightFacade.removeDataset(id);
        return expect(futureResult).to.eventually.rejectedWith(NotFoundError);
    });

    it("Should remove a dataset that was first added", function () {
        const id1: string = "courses";
        const expectedAdd: string[] = [id1];
        const expectedRemove: string = id1;
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.eventually.deep.equal(expectedAdd)
            .then(() => {
                // next function call here
                const futureResult2: Promise<
                    string
                > = insightFacade.removeDataset(id1);
                return expect(futureResult2).to.eventually.deep.equal(
                    expectedRemove,
                );
            });
    });

    it("Should not remove a dataset with empty id after adding a valid dataset", function () {
        const validID: string = "courses";
        const expectedOnAdd: string[] = [validID];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            validID,
            datasets[validID],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.eventually.deep.equal(expectedOnAdd)
            .then(() => {
                // next function call here
                const futureResult2: Promise<
                    string
                > = insightFacade.removeDataset("");
                // we are expecting it to fail so (Y)
                return expect(futureResult2).to.eventually.be.rejectedWith(
                    InsightError,
                );
            });
    });

    it("Should not remove a dataset with valid id that does not exist", function () {
        const validID: string = "courses"; // 4 spaces
        const futureResult: Promise<string> = insightFacade.removeDataset(
            validID,
        );
        return expect(futureResult).to.eventually.rejectedWith(NotFoundError);
    });

    it("Should not remove a dataset with valid id after adding another dataset", function () {
        const id1: string = "courses1";
        const expectedOnAdd: string[] = [id1];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.eventually.deep.equal(expectedOnAdd)
            .then(() => {
                // next function call here
                const futureResult2: Promise<string> = insightFacade.removeDataset("courses");
                // we are expecting it to fail so (Y)
                return expect(futureResult2).to.eventually.be.rejectedWith(
                    NotFoundError,
                );
            });
    });

    it(
        "Should not remove a dataset with id containing underscore after " +
            "adding another dataset",
        function () {
            const id1: string = "courses1";
            const expected1: string[] = [id1];
            const futureResult: Promise<string[]> = insightFacade.addDataset(
                id1,
                datasets[id1],
                InsightDatasetKind.Courses,
            );
            return expect(futureResult)
                .to.eventually.deep.equal(expected1)
                .then(() => {
                    // next function call here
                    const futureResult2: Promise<
                        string
                    > = insightFacade.removeDataset("cour_ses");
                    // we are expecting it to fail so (Y)
                    return expect(futureResult2).to.eventually.be.rejectedWith(
                        InsightError,
                    );
                });
        },
    );

    it(
        "Should not remove a dataset with id starting with underscore after " +
            "adding another dataset",
        function () {
            const id1: string = "courses1";
            const expected1: string[] = [id1];
            const futureResult: Promise<string[]> = insightFacade.addDataset(
                id1,
                datasets[id1],
                InsightDatasetKind.Courses,
            );
            return expect(futureResult)
                .to.eventually.deep.equal(expected1)
                .then(() => {
                    // next function call here
                    const futureResult2: Promise<
                        string
                    > = insightFacade.removeDataset("_courses");
                    // we are expecting it to fail so (Y)
                    return expect(futureResult2).to.eventually.be.rejectedWith(
                        InsightError,
                    );
                });
        },
    );

    it(
        "Should not remove a dataset with id ending with underscore after " +
            "adding another dataset",
        function () {
            const id1: string = "courses1";
            const expected1: string[] = [id1];
            const futureResult: Promise<string[]> = insightFacade.addDataset(
                id1,
                datasets[id1],
                InsightDatasetKind.Courses,
            );
            return expect(futureResult)
                .to.eventually.deep.equal(expected1)
                .then(() => {
                    // next function call here
                    const futureResult2: Promise<
                        string
                    > = insightFacade.removeDataset("courses_");
                    // we are expecting it to fail so (Y)
                    return expect(futureResult2).to.eventually.be.rejectedWith(
                        InsightError,
                    );
                });
        },
    );

    it(
        "Should not remove a dataset with id containing only whitespaces after " +
            "adding another dataset",
        function () {
            const id1: string = "courses1";
            const expected1: string[] = [id1];
            const futureResult: Promise<string[]> = insightFacade.addDataset(
                id1,
                datasets[id1],
                InsightDatasetKind.Courses,
            );
            return expect(futureResult)
                .to.eventually.deep.equal(expected1)
                .then(() => {
                    // next function call here
                    const futureResult2: Promise<
                        string
                    > = insightFacade.removeDataset("    ");
                    // we are expecting it to fail so (Y)
                    return expect(futureResult2).to.eventually.be.rejectedWith(
                        InsightError,
                    );
                }); // .then(reult of first .then call will be passed as param to this)
        },
    );

    it("Should add valid dataset1, add valid dataset2, then remove dataset1", function () {
        const id1: string = "courses1";
        const id2: string = "courses2";
        const expected1: string[] = [id1];
        const expected2: string[] = [id1, id2];
        const expected3: string[] = [id2];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.eventually.deep.equal(expected1)
            .then(() => {
                // next function call here
                const futureResult2: Promise<
                    string[]
                > = insightFacade.addDataset(
                    id2,
                    datasets[id2],
                    InsightDatasetKind.Courses,
                );
                // we are expecting it to fail so (Y)
                return expect(futureResult2)
                    .to.eventually.deep.equal(expected2)
                    .then(() => {
                        const futureResult3: Promise<
                            string
                        > = insightFacade.removeDataset(id1);
                        return expect(futureResult2).to.eventually.deep.equal(
                            expected3,
                        );
                    });
            });
    });

    // TESTS: listDatasets
    // TODO
    it("Should list an empty dataset when nothing has been added", function () {
        const expected: InsightDataset[] = [];
        const futureResult: Promise<
            InsightDataset[]
        > = insightFacade.listDatasets();
        return expect(futureResult).to.eventually.deep.equals(expected);
    });
    // should add ds, then list that one dataset

    // it("Should add an empty dataset, then list that one empty dataset", function () {
    //     const id1: string = "emptydataset";
    //     const expected1: InsightDataset[] = [
    //         { id: id1, kind: InsightDatasetKind.Courses, numRows: 0 },
    //     ];
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id1,
    //         datasets[id1],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult)
    //         .to.eventually.deep.equal(expected1)
    //         .then(() => {
    //             // next function call here
    //             const futureResult2: Promise<
    //                 InsightDataset[]
    //             > = insightFacade.listDatasets();
    //             // we are expecting it to fail so (Y)
    //             return expect(futureResult2).to.eventually.deep.equals(
    //                 expected1,
    //             );
    //         }); // .then(result of first .then call will be passed as param to this)
    // });

    // it("Should add a dataset, then list that one dataset", function () {
    //     const id1: string = "zoolOnly36results";
    //     const expectedOnAdd: string[] = [id1];
    //     const expectedOnList: InsightDataset[] = [
    //         { id: id1, kind: InsightDatasetKind.Courses, numRows: 36 },
    //     ];
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id1,
    //         datasets[id1],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult)
    //         .to.eventually.deep.equal(expectedOnAdd)
    //         .then(() => {
    //             // next function call here
    //             const futureResult2: Promise<
    //                 InsightDataset[]
    //             > = insightFacade.listDatasets();
    //             // we are expecting it to fail so (Y)
    //             return expect(futureResult2).to.eventually.deep.equals(
    //                 expectedOnList,
    //             );
    //         }); // .then(result of first .then call will be passed as param to this)
    // });

    it("Should add a dataset, then another dataset, then list both", function () {
        const id1: string = "zoolOnly36results";
        const id2: string = "nestOnly82results";
        const expectedOnAdd1: string[] = [id1];
        const expectedOnAdd2: string[] = [id1, id2];
        const expectedOnList: InsightDataset[] = [
            { id: id1, kind: InsightDatasetKind.Courses, numRows: 36 },
            { id: id2, kind: InsightDatasetKind.Courses, numRows: 82 },
        ];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.eventually.deep.equal(expectedOnAdd1)
            .then(() => {
                // next function call here
                const futureResult2: Promise<
                    string[]
                > = insightFacade.addDataset(
                    id2,
                    datasets[id2],
                    InsightDatasetKind.Courses,
                );
                return expect(futureResult2)
                    .to.eventually.deep.equal(expectedOnAdd2)
                    .then(() => {
                        const futureResult3: Promise<
                            InsightDataset[]
                        > = insightFacade.listDatasets();
                        return expect(futureResult3).to.eventually.deep.equals(
                            expectedOnList,
                        );
                    });
            }); // .then(result of first .then call will be passed as param to this)
    });

    it("Should add a dataset, then delete it, then list empty", function () {
        const id1: string = "zoolOnly36results";
        const id2: string = "nestOnly82results";
        const expectedOnAdd: string[] = [id1];
        const expectedOnRemove: string[] = [];
        const expectedOnList: InsightDataset[] = [];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.eventually.deep.equal(expectedOnAdd)
            .then(() => {
                // next function call here
                const futureResult2: Promise<
                    string
                > = insightFacade.removeDataset(id1);
                return expect(futureResult2)
                    .to.eventually.deep.equal(expectedOnRemove)
                    .then(() => {
                        const futureResult3: Promise<
                            InsightDataset[]
                        > = insightFacade.listDatasets();
                        return expect(futureResult3).to.eventually.deep.equals(
                            expectedOnList,
                        );
                    });
            }); // .then(result of first .then call will be passed as param to this)
    });
    // Should add a dataset, add the same dataset again, then list only one
    it("Should add a dataset, then add it again (reject), then list it only once", function () {
        const id1: string = "zoolOnly36results";
        const expectedOnAdd: string[] = [id1];
        const expectedOnList: InsightDataset[] = [
            { id: id1, kind: InsightDatasetKind.Courses, numRows: 36 },
        ];
        const futureResult: Promise<string[]> = insightFacade.addDataset(
            id1,
            datasets[id1],
            InsightDatasetKind.Courses,
        );
        return expect(futureResult)
            .to.eventually.deep.equal(expectedOnAdd)
            .then(() => {
                // next function call here
                const futureResult2: Promise<
                    string[]
                > = insightFacade.addDataset(
                    id1,
                    datasets[id1],
                    InsightDatasetKind.Courses,
                );
                return expect(futureResult2)
                    .to.eventually.be.rejectedWith(InsightError)
                    .then(() => {
                        const futureResult3: Promise<
                            InsightDataset[]
                        > = insightFacade.listDatasets();
                        return expect(futureResult3).to.eventually.deep.equals(
                            expectedOnList,
                        );
                    });
            }); // .then(result of first .then call will be passed as param to this)
    });
});
// should add d1 only once even on duplicate call and delete the one d1 instance
// should add d1, d2
// should not delete d1, then add d1
// how to translate what i want to test to the actual test
// how to come up with more tests
// invalid and valid cases, more complex valid cases. add 2+ datasets.
// combining add remove and list
// confirm understanding of promise and .then and .catch (what are reject and resolve)
// Insight error is our default error?
// autograder -> I should commit progress without regression but don't i have to commit to run the bot
// see piazza post for steps
// clarify: testing the input vs testing the actual call? ie , one is valid and the other is invalid
// is numRows just the number of rows that appear in a query in reference UI? What about duplicate results?

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        courses: {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * TODO For C1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    // no tests needed for perform query. just add data files to query folder
    // make valid and invalid QUERIES, using the result: thing
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<
                        any[]
                    > = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
