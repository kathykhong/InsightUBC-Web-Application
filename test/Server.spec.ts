import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";
import * as fs from "fs-extra";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        try {
            server.start();
        } catch (err) {
            Log.error("error starting the server");
        }
    });

    after(function () {
        // TODO: stop server here once!
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.trace("beforeEach has been called");
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.trace("afterEach has been called");
    });

    // Sample on how to format PUT requests
    it("DEL test for courses dataset with 404", function () {
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses";
        try {
            return chai.request(SERVER_URL).del(ENDPOINT_URL)
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            // and some more logging here!
            Log.error("DEL test error" + err);
        }
    });

    it("PUT test for courses dataset", function () {
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses/courses";
        const data = fs.readFileSync("./test/data/courses.zip");
        let ZIP_FILE_DATA = data;

        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    // Log.trace(res);
                    // expect(true).to.be.equal(true);
                    expect(res.status).to.be.equal(200);
                    // can we do this?
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("PUT test caught" + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.error("PUT test error" + err);
        }
    });

    it("PUT test for courses dataset with 400", function () {
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/cou_rses/courses";
        const data = fs.readFileSync("./test/data/courses.zip");
        let ZIP_FILE_DATA = data;

        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    // Log.trace(res);
                    expect.fail();
                    // expect(true).to.be.equal(true);
                    // expect(err.status).to.be.equal(400);
                    // can we do this?
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.be.equal(400);
                    Log.trace("PUT test caught" + err);
                });
        } catch (err) {
            // and some more logging here!
            Log.error("PUT test error" + err);
        }
    });

    it("GET test for courses dataset", function () {
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/datasets";
        const data = fs.readFileSync("./test/data/courses.zip");
        let ZIP_FILE_DATA = data;

        try {
            return chai.request(SERVER_URL)
                .get(ENDPOINT_URL)
                .then(function (res: Response) {
                    // some logging here please!
                    // Log.trace(res);
                    // expect(true).to.be.equal(true);
                    expect(res.status).to.be.equal(200);
                    // can we do this?
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("GET test caught" + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.error("GET test error" + err);
        }
    });

    it("DEL test for courses dataset with 400", function () {
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/cour_ses";
        try {
            return chai.request(SERVER_URL).del(ENDPOINT_URL)
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            Log.error("DEL test error" + err);
        }
    });

    it("DEL test for courses dataset", function () {
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses";
        try {
            return chai.request(SERVER_URL).del(ENDPOINT_URL)
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace("line 97 OF DELETE TEST");
                    // some logging here please!
                    Log.trace("PUT + DEL test caught" + err);
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            Log.trace("line 104");
            Log.error("DEL test error" + err);
        }
    });

    it("POST test for courses dataset", function () {
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/query";
        let query = {WHERE: {GT: {courses_avg: 97}},
            OPTIONS: {COLUMNS: ["courses_dept", "courses_avg"], ORDER: "courses_avg"}};
        try {
            return chai.request(SERVER_URL)
                .post(ENDPOINT_URL)
                .send(query)
                .then(function (res: Response) {
                    expect(res.status).to.be.equal(400);
                    // can we do this?
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("PUT test caught" + err);
                });
        } catch (err) {
            // and some more logging here!
            Log.error("PUT test error" + err);
        }
    });

    it("POST test for courses dataset with 400", function () {
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/query";
        let query = {WHERE: {GT: {courses_avg: 97}}};
        try {
            return chai.request(SERVER_URL)
                .post(ENDPOINT_URL)
                .send(query)
                .then(function (res: Response) {
                    expect.fail();
                    // can we do this?
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.be.equal(400);
                    Log.trace("PUT test caught" + err);
                });
        } catch (err) {
            // and some more logging here!
            expect(err.status).to.be.equal(400);
            Log.error("PUT test error" + err);
        }
    });


    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
