import {Filter} from "./Filter";
export enum mfield {
    average = "avg",
    pass = "pass",
    fail = "fail"
}
export class MCompEQ implements Filter {
    public value: number;
    public field: string;

    public processFilter(): boolean {
        return false;
    }
}
