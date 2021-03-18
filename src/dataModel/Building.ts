import {Room} from "./Room";

export class Building {
    public listOfRooms: Room[] = [];

    public getListOfRooms() {
        return this.listOfRooms;
    }

}
