import {Filter} from "./Filter";

export class LogicOr implements Filter {
    public innerFilter: Filter;

    public processFilter(): boolean {
        return false;
    }

    public getInnerFilter(): Filter {
        return this.innerFilter;
    }

    public setInnerFilter(filter: Filter) {
        this.innerFilter = filter;
    }
}
