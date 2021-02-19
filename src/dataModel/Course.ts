import {Section} from "./Section";

export class Course {
    private sections: Section[];

    constructor() {
        this.sections = [];
    }


    public getSections(): Section[] {
        return this.sections;
    }
}
