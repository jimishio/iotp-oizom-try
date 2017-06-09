import { Component, OnInit }    from '@angular/core';
import { IBMIoTPService }       from '../../services/iotp/ibmIoTP.service';
import { LiveDataService }      from '../../services/livedata/liveData.service';

// Carbon Design Framework
import { DataTable }            from 'carbon-components';
import { Checkbox }             from 'carbon-components';

@Component({
  templateUrl: './devices.component.html',
  styles: [`
    button[disabled] {
      opacity: 0.5;
      cursor:  not-allowed;
    }

    input[type="text"][disabled] {
      cursor: auto;
    }
  `]
})

export class DevicesComponent implements OnInit {
  // Devices List
  errorMessage  : string;
  devices;
  totalDevices  : number;
  bookmark      : string;
  bookmarks     = {};
  limit         : number = 10;
  orderBy       : string = "deviceId";
  currentPage   : number = 1;
  totalPages    : number = 0;

  
  // Live Data
  connection;
  liveData = {};
  messages = [];
  message;
  mqttStatus: boolean = false;
  liveDataSubscribedOnInit: boolean = false;

  constructor (private ibmIoTP: IBMIoTPService, private liveDataService: LiveDataService) {}

  ngOnInit() {
    this.connection = this.liveDataService.getMessages().subscribe(message => {
      this.messages.push(message);

      if (message["type"] === "new_sensorData") {
        console.log("TEXT", message["text"]);

        var payload     = JSON.parse(message["text"])["d"];
        const deviceId  = payload["id"];
        
        for (let device of this.devices) {
          if (device.deviceId === deviceId) {
            device["data"] = payload;
          }
        }
      } else if (message["type"] === "mqtt_status") {
        this.mqttStatus = message["text"].connected;
      }
    });
    
    this.getDevices();

    this.mqttStatusInquiry();
  }

  getDevices(bookmark?: string, pagination?: string) {
    var params = {
      bookmark   : bookmark,
      limit      : this.limit.toString(),
      orderBy    : this.orderBy
    };

    this.ibmIoTP.getDevices(params).then(
      devices => {
        console.log("Devices:", devices);

        if (pagination) {
          if      (pagination === "next") this.currentPage = this.currentPage + 1;
          else if (pagination === "prev") this.currentPage = this.currentPage - 1;
        } else {
          this.currentPage = 1;
        }

        this.devices      = devices["results"];

        this.totalDevices = devices["meta"].total_rows;
        this.totalPages   = Math.ceil(this.totalDevices / this.limit);
        
        this.bookmark     = devices["bookmark"];
        this.bookmarks[this.currentPage] = devices["bookmark"];

        // Get last cached event for all devices loaded
        var index = 0;
        for (let device of this.devices) {
            this.ibmIoTP.getLastCachedEvent(device.deviceId).then(
              eventData => {
                console.log("Event:", atob(eventData["payload"]));

                device["data"] = JSON.parse(atob(eventData["payload"]))["d"];
              }, error =>  this.errorMessage = <any>error);
            
            // Only runs this code when the page is loading for the first time
            if (!this.liveDataSubscribedOnInit && index < 5) {
              this.setLiveData(index, true);

              index += 1;
            }
        }

        this.liveDataSubscribedOnInit = true;
      }, error =>  this.errorMessage = <any>error);
  }

  revertSort() {
    this.orderBy = (this.orderBy.charAt(0) !== '-') ? ("-" + this.orderBy) : (this.orderBy.substring(1));

    this.getDevices();
  }

  sum(a, b) {
    return parseInt(a)+parseInt(b);
  }

  nextPage() {
    this.getDevices(this.bookmark, "next");
  }

  prevPage() {
    this.getDevices(this.bookmarks[this.currentPage-2], "prev");
  }

  sendMessage() {
    this.liveDataService.sendMessage('new-data', this.message);
  }

  mqttStatusInquiry() {
    this.liveDataService.sendMessage('mqtt_status_inquiry', {});
  }

  setLiveData(index, turnOn) {
    var deviceId = this.devices[index].deviceId;

    if (turnOn) {
      console.log("Turn ON Live Data for", deviceId);
    } else {
      console.log("Turn OFF Live Data for", deviceId);
    }

    this.liveData[deviceId] = turnOn;

    const socketData = {
      deviceId: this.devices[index].deviceId,
      turnOn: this.liveData[deviceId]
    };
    
    this.liveDataService.sendMessage('mqtt_set', JSON.stringify(socketData));
  }
  
  ngOnDestroy() {
    this.connection.unsubscribe();
  }
};