import {Section} from "./Section";

export class Course {
    private sections: Section[];

    constructor(sections: Section[]) {
        this.sections = sections;
    }
}
