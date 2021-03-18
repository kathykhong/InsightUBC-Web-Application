export class Room {

    public latLon: any;
    public fullname: string;
    public shortname: string;
    public number: string;
    public name: string;
    public address: string;
    public seats: number;
    public type: string;
    public furniture: string;
    public href: string;


    public setLatLon(data: any) {
        this.latLon = data;
    }

    public setFullname(fullname: string) {
        this.fullname = fullname;
    }

    public setShortname(shortname: string) {
        this.shortname = shortname;
    }

    public setNumber(roomNumber: string) {
        this.number = roomNumber;
    }

    public setName(name: string) {
        this.name = name;
    }

    public setAddress(address: string) {
        this.address = address;
    }

    public setSeats(seats: number) {
        this.seats = seats;
    }

    public setType(type: string) {
        this.type = type;
    }

    public setFurniture(furniture: string) {
        this.furniture = furniture;
    }

    public setLink(link: string) {
        this.href = link;
    }

    public getRoomShortname() {
        return this.shortname;
    }

}
