/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = (query) => {

    return new Promise((resolve, reject) => {
        // TODO: implement!
        let xhr = new XMLHttpRequest();
        xhr.open("POST", '/query', true);

//Send the proper header information along with the request
        xhr.setRequestHeader("Content-Type", "application/json");


        // setting up the an event handler on xhr req
        // when ready state has changed , RUN this function
        // look at xhr.onload
        // look at xhr.error
        xhr.onload = function() { // Call a function when the state changes.
            if (this.readyState === XMLHttpRequest.DONE) {
                if (this.status === 400) {
                    reject();
                } else {
                    resolve();
                }
            }
        }


        xhr.send(JSON.stringify(query));

        console.log("CampusExplorer.sendQuery not implemented yet.");
    })
};
