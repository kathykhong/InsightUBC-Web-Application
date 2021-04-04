import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Log from "../src/Util";

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

    it("PUT test for courses dataset", function () {
        let SERVER_URL = "http://localhost:4321";
        let ENDPOINT_URL = "/dataset/courses/courses";
        let ZIP_FILE_DATA = "./test/data/courses.zip";
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(res);
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.be.equal(["courses"]);
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

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
