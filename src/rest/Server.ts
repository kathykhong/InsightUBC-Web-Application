/**
 * Created by rtholmes on 2016-06-19.
 */

import fs = require("fs");
import restify = require("restify");
import Log from "../Util";
import InsightFacade from "../controller/InsightFacade";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;
   // private static insightFacade: InsightFacade;
   // private insightFacade: InsightFacade;
    private static insightFacade: InsightFacade;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info("Server::close()");
        const that = this;
        return new Promise(function (fulfill) {
            that.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        const that = this;
        Server.insightFacade = new InsightFacade();
        return new Promise(function (fulfill, reject) {
            try {
                Log.info("Server::start() - start");

                that.rest = restify.createServer({
                    name: "insightUBC",
                });
                that.rest.use(restify.bodyParser({mapFiles: true, mapParams: true}));
                that.rest.use(
                    function crossOrigin(req, res, next) {
                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Headers", "X-Requested-With");
                        return next();
                    });

                // This is an example endpoint that you can invoke by accessing this URL in your browser:
                // http://localhost:4321/echo/hello
                that.rest.get("/echo/:msg", Server.echo);

                // NOTE: your endpoints should go here
                that.rest.put("/dataset/:id/:kind", Server.putIDKind);

                that.rest.del("/dataset/:id", Server.deleteID);
                that.rest.post("/query", Server.postQuery);
                that.rest.get("/datasets", Server.getDataset);

                // This must be the last endpoint!
                that.rest.get("/.*", Server.getStatic);

                that.rest.listen(that.port, function () {
                    Log.info("Server::start() - restify listening: " + that.rest.url);
                    fulfill(true);
                });

                that.rest.on("error", function (err: string) {
                    // catches errors in restify start; unusual syntax due to internal
                    // node not using normal exceptions here
                    Log.info("Server::start() - restify ERROR: " + err);
                    reject(err);
                });

            } catch (err) {
                Log.error("Server::start() - ERROR: " + err);
                reject(err);
            }
        });
    }

    private static getDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::putIDKind(..) - params: " + JSON.stringify((req.params)));
        try {
            Server.insightFacade.listDatasets()
                .then((result: InsightDataset[]) => {
                    Log.info("Server::putIDKind(..) - responding " + 200);
                    res.json(200, {result: result});
                })
                .catch((err: any) => {
                    Log.trace("inside catch");
                    res.json(400, {error: err.message});
                    Log.trace("end of inside catch");
                });
        } catch (err) {
            Log.trace("outside catch");
            Log.trace(err);
            Log.error("Server::putIDKind(..) - responding 400");
            res.json(400, {error: err.message});
        }
        return next();
    }

    private static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::deleteID(..) - params: " + JSON.stringify((req.params)));
        try {
            Server.insightFacade.performQuery(req.body)
                .then((result: any[]) => {
                    Log.info("Server::postQuery(..) - responding " + 200);
                    res.json(200, {result: result});
                })
                .catch((err: any) => {
                    {Log.error("Server::postQuery(..) - responding 400"); }
                    res.json(400, {error: err.message});
                });
            // res body is list of datasetIDs added so far
        } catch (err) {
            Log.trace(err);
            {Log.error("Server::postQuery(..) - responding 400"); }
            res.json(400, {error: err.message});
        }
        return next();
    }

    private static deleteID(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::deleteID(..) - params: " + JSON.stringify((req.params)));
        try {
            Log.trace("made it to delete");
            Log.trace("delete id" + req.params.id);
            Server.insightFacade.removeDataset(req.params.id)
                .then((result: string) => {
                    Log.info("Server::deleteID(..) - responding " + 200);
                    res.json(200, {result: result});
                    Log.trace(result);
                })
            .catch((error: any) => {
                if (error instanceof InsightError) {
                    {Log.error("Server::deleteID(..) - responding 400"); }
                    res.json(400, {error: error.message});
                }
                if (error instanceof NotFoundError) {
                    {Log.error("Server::deleteID(..) - responding 404"); }
                    res.json(404, {error: error.message});
                }
            });
            // res body is list of datasetIDs added so far
        } catch (err) {
            Log.trace(err);
            res.json(400, {error: err.message});
        }
        return next();
    }


    // The next two methods handle the echo service.
    // These are almost certainly not the best place to put these, but are here for your reference.
    // By updating the Server.echo function pointer above, these methods can be easily moved.
    private static echo(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            const response = Server.performEcho(req.params.msg);
            Log.info("Server::echo(..) - responding " + 200);
            res.json(200, {result: response});
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err.message});
        }
        return next();
    }

    private static performEcho(msg: string): string {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        } else {
            return "Message not provided";
        }
    }

    private static putIDKind(req: restify.Request, res: restify.Response, next: restify.Next) {
        const that = this;
        Log.trace("Server::putIDKind(..) - params: " + JSON.stringify((req.params)));
        try {
           // Log.trace(req.body);
           // Log.trace("Buffer is" + req.body);
            let base64dataset = Buffer.from(req.body, "binary").toString("base64");
           // let base64dataset = req.body.toString("base64");
            Log.trace("after  base 64");
           // Log.trace(base64dataset);
            Server.insightFacade.addDataset(req.params.id, base64dataset, req.params.kind)
                .then((result: string[]) => {
                    Log.info("Server::putIDKind(..) - responding " + 200);
                    res.json(200, {result: result});
                })
                .catch((err: any) => {
                    Log.trace("inside catch");
                    {Log.error("Server::putIDKind(..) - responding 400"); }
                    res.json(400, {error: err.message});
                    Log.trace("end of inside catch");
                });
        } catch (err) {
            Log.trace("outside catch");
            Log.trace(err);
            Log.error("Server::putIDKind(..) - responding 400");
            res.json(400, {error: err.message});
        }
        return next();
    }

    private static getStatic(req: restify.Request, res: restify.Response, next: restify.Next) {
        const publicDir = "frontend/public/";
        Log.trace("RoutHandler::getStatic::" + req.url);
        let path = publicDir + "index.html";
        if (req.url !== "/") {
            path = publicDir + req.url.split("/").pop();
        }
        fs.readFile(path, function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

}
