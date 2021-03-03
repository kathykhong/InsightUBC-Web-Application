import { Section } from "./Section";

export class Course {
    protected sections: Section[];

    constructor() {
        this.sections = [];
    }

    public getSections(): Section[] {
        return this.sections;
    }
}
