import { InsightError } from "../controller/IInsightFacade";

export class Section {
    // numerical fields
    public avg: number;
    public pass: number;
    public fail: number;
    public audit: number;
    public year: number;
    // string fields
    public dept: string;
    public id: string;
    public instructor: string;
    public title: string;
    public uuid: string;

    public setAvg(value: number) {
        this.avg = value;
    }

    public setPass(value: number) {
        this.pass = value;
    }

    public setFail(value: number) {
        this.fail = value;
    }

    public setAudit(value: number) {
        this.audit = value;
    }

    public setYear(value: number) {
        this.year = value;
    }

    public setDept(value: string) {
        this.dept = value;
    }

    public setId(value: string) {
        this.id = value;
    }

    public setInstructor(value: string) {
        this.instructor = value;
    }

    public setTitle(value: string) {
        this.title = value;
    }

    public setUuid(value: string) {
        this.uuid = value;
    }

    public getAvg(): number {
        return this.avg;
    }

    public getPass(): number {
        return this.pass;
    }

    public getFail(): number {
        return this.fail;
    }

    public getAudit(): number {
        return this.audit;
    }

    public getYear(): number {
        return this.year;
    }

    public getDept(): string {
        return this.dept;
    }

    public getId(): string {
        return this.id;
    }

    public getInstructor(): string {
        return this.instructor;
    }

    public getTitle(): string {
        return this.title;
    }

    public getUuid(): string {
        return this.uuid;
    }

    public getArg(arg: string): any {
        switch (arg) {
            case "dept": {
                return this.getDept();
            }
            case "id": {
                return this.getId();
            }
            case "instructor": {
                return this.getInstructor();
            }
            case "title": {
                return this.getTitle();
            }
            case "uuid": {
                return this.getUuid();
            }
            case "avg": {
                return this.getAvg();
            }
            case "pass": {
                return this.getPass();
            }
            case "fail": {
                return this.getFail();
            }
            case "audit": {
                return this.getAudit();
            }
            case "year": {
                return this.getYear();
            }
            default:
                throw new InsightError("Invalid arguments in columns");
        }
    }
}
