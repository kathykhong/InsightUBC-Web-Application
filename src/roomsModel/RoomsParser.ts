const parse5 = require("parse5");

export class RoomsParser {
    public indexBuildingCodes: string[];

    // set building codes that we want to actually add
    // todo: where to add promise.reject ie. error cases in a chain of events
    public setIndexBuildingCodes(indexHTML: string) {
        this.parseHTML(indexHTML).then((parsedHTML) => {
            this.indexBuildingCodes = this.findBuildingCodes(parsedHTML);
        });
    }

    // calls parse5.parse on an html string
    public parseHTML(html: string): Promise<any> {
        return Promise.resolve(parse5.parse(html));
    }

    public findBuildingCodes(element: any): string[] {
        // todo: figure out how to access the building-code inside table-body
        // todo: iterate through the tr's, grab the 2nd column which will be the build-code
        return [];
    }
}
