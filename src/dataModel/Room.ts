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
    public applyKeyStorage: any = {} ; // {overallAvg: 55, maxFail: 6};


    public setLatLon(data: any) {
        this.latLon = data;
    }

    public getLatLon(): any {
        return this.latLon;
    }

    public getLat(): number {
        return this.latLon.lat;
    }

    public getLon(): number {
        return this.latLon.lon;
    }

    public setFullname(fullname: string) {
        this.fullname = fullname;
    }

    public getFullname(): string {
        return this.fullname;
    }

    public setShortname(shortname: string) {
        this.shortname = shortname;
    }

    public getShortname(): string {
        return this.shortname;
    }

    public setNumber(roomNumber: string) {
        this.number = roomNumber;
    }

    public getNumber(): string {
        return this.number;
    }

    public setName(name: string) {
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }

    public setAddress(address: string) {
        this.address = address;
    }

    public getAddress(): string {
        return this.address;
    }

    public setSeats(seats: number) {
        this.seats = seats;
    }

    public getSeats(): number {
        return this.seats;
    }

    public setType(type: string) {
        this.type = type;
    }

    public getType(): string {
        return this.type;
    }

    public setFurniture(furniture: string) {
        this.furniture = furniture;
    }

    public getFurniture(): string {
        return this.furniture;
    }

    public setLink(link: string) {
        this.href = link;
    }

    public getLink(): string {
        return this.href;
    }

    public getArg(anykey: string): any {
      switch (anykey) {
          case "latLon": {
              return this.getLatLon();
          }
          case "fullname": {
              return this.getFullname();
          }
          case "lat": {
              return  this.getLat();
          }
          case "lon": {
              return this.getLon();
          }
          case "shortname": {
              return this.getShortname();
          }
          case "number": {
              return this.getNumber();
          }
          case "name": {
              return this.getName();
          }
          case "address": {
              return this.getAddress();
          }
          case "type": {
              return this.getType();
          }
          case "seats": {
              return this.getSeats();
          }
          case "furniture": {
              return this.getFurniture();
          }
          case "href": {
              return this.getLink();
          }
      }
    }

}
