const parse5 = require("parse5");

export class RoomsParser {
    public indexBuildingCodes: string[];

    // set building codes that we want to actually add
    // todo: where to add promise.reject ie. error cases in a chain of events
   /* public setIndexBuildingCodes(indexHTML: string) {
        this.parseHTML(indexHTML).then((parsedHTML) => {
            this.findBuildingCodes(parsedHTML);
        });
    }*/

    // calls parse5.parse on an html string and returns a tree
    public parseHTML(html: string): Promise<any> {
        return Promise.resolve(parse5.parse(html));
    }

   /* public findBuildingCodes(element: any): void {
        // todo: figure out how to access the building-code inside table-body
        // todo: iterate through the tr's, grab the 2nd column which will be the build-code
        let tableBody: any = this.findTableBody(element);
        if (tableBody !== "") {
            let listOfRowsAndText: any = tableBody.childNodes;
            for (let child of listOfRowsAndText) {
                if (child.nodeName === "tr") {
                    let row: any = child;
                    let rowCells: any = row.childNodes;
                    let codeCell: any = rowCells[3];
                    if (codeCell.nodeName === "td" && codeCell.childNodes.length === 1
                        && codeCell.childNodes[0].nodeName === "#text") {
                        let code: string = codeCell.childNodes[0].value;
                        this.indexBuildingCodes.push(code);
                    }
                }
            }
        }


    }

    private findTableBody(element: any): any {
        if (element.nodeName === "tbody" && element.attrs.isEmpty()) {
            return element;
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                this.findTableBody(child);
            }
        }
        return "";
    }*/
}
