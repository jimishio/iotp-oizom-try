import { Component, OnInit }    from '@angular/core';
import { IBMIoTPService }       from '../../services/iotp/ibmIoTP.service';
import { LiveDataService }      from '../../services/livedata/liveData.service';
import * as moment from "moment";
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
  livedataDevice : Array<string> = [];
  deviceStatus  : Array<any> = []
  deviceId : Array<string> = []
  activeDevice: any = []
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
      
      // var str_message = JSON.stringify(message['text']);
      // message = str_message.replace('\"','"');
      // message = JSON.parse(String(message));
      if(message["type"] == "new_sensorData"){
        this.messages.push(JSON.parse(message['text']));
        // console.log(message);
        // console.log("message Id: ", message['id'])
        
        if(this.deviceId.indexOf(message['id']) <= -1){

          console.log("device not found!!!");
          this.deviceId.push(message['id']);

          this.deviceStatus.push({
            deviceId : message['id'],
            lastUpdate  :  moment.unix(JSON.parse(message['text']).d.t).format('llll')
          })
        }
        // console.log("devieID: ", this.deviceId);

        

        if(this.deviceId.indexOf(message['id']) > -1){
          for(let i = 0; i < this.deviceStatus.length; i++){
            if(this.deviceStatus[i].deviceId == message['id']){
              this.deviceStatus[i].lastUpdate = moment.unix(JSON.parse(message['text']).d.t).format('llll')
              // console.log("date updated!!")
            }
          }
        }
        
      for(let device of this.deviceStatus){

        if(Math.round((new Date()).getTime() / 1000) - parseInt(device.lastUpdate) > 3600){
          this.deviceStatus.splice(this.deviceStatus.indexOf(device), 1);
        }
      }
      // console.log(this.deviceStatus);


      

      if (message["type"] === "new_sensorData") {
        // console.log("TEXT", message["text"]);

        var payload = JSON.parse(message["text"])["d"];
        const deviceId = payload["id"];

        for (let device of this.devices) {


          device["currentStatus"] = false;
          if (device.deviceId === deviceId) {
            device["data"] = payload;
            
          }
          
          
          for(let i = 0; i < this.deviceStatus.length; i ++ ){

            if(this.deviceStatus[i].deviceId == device.deviceId){
              console.log("DeviceId matched!!!!")
              device["lastUpdate"] = this.deviceStatus[i].lastUpdate;
              device["currentStatus"] = true;
              this.liveData[device.deviceId] = true;
            } else {
            }
          }

          // for(let currentDevice of this.deviceStatus){
            
          //   if(currentDevice.deviceId == device.devicId){
          //     device['lastUpdate'] = currentDevice.lastUpdate;
          //     device['currentStatus'] = true;
          //   }
            
          // }
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
        // console.log("Devices:", devices);

        if (pagination) {
          if      (pagination === "next") this.currentPage = this.currentPage + 1;
          else if (pagination === "prev") this.currentPage = this.currentPage - 1;
        } else {
          this.currentPage = 1;
        }

        this.devices      = devices["results"];

           let ado = localStorage.getItem('activeDevice')
           console.log(ado)

        // console.log(this.devices)

        this.totalDevices = devices["meta"].total_rows;
        this.totalPages   = Math.ceil(this.totalDevices / this.limit);

        this.bookmark     = devices["bookmark"];
        this.bookmarks[this.currentPage] = devices["bookmark"];

        // Get last cached event for all devices loaded
        // var index = 0;
        // for (let device of this.devices) {
        //     this.ibmIoTP.getLastCachedEvent(device.deviceId).then(
        //       eventData => {
        //         console.log("Event:", atob(eventData["payload"]));

        //         device["data"] = JSON.parse(atob(eventData["payload"]))["d"];
        //       }, error =>  this.errorMessage = <any>error);

        //     // Only runs this code when the page is loading for the first time
        //     if (!this.liveDataSubscribedOnInit && index < 5) {
        //       this.setLiveData(index, true);

        //       index += 1;
        //     }
        // }

        this.liveDataSubscribedOnInit = true;
      }, error =>  this.errorMessage = <any>error);
  }

  revertSort() {
    this.orderBy = (this.orderBy.charAt(0) !== '-') ? ("-" + this.orderBy) : (this.orderBy.substring(1));

    this.getDevices();
  }

  /**
   * Display time in human format
   * @param {number} time Time from server from time stamp
   * @returns Time in human readable format
   */
  displayTime(time:string): string {
    return (time ? moment.utc(time).utcOffset("+05:30").format("DD MMM YYYY, h:mm A") : "No data available");
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
      // console.log("turn on: 1 --------->", turnOn)

    } else {
      console.log("Turn OFF Live Data for", deviceId);
      // console.log("turn on: 2 --------->", turnOn)
      
      
    }
    
    let getacticeDevices = this.liveDataService.getActiveDevices().subscribe(message => { 

      this.activeDevice = JSON.parse(JSON.stringify(message));
     
     console.log("active device:  1------>> ", this.activeDevice)
      if(this.liveData[deviceId] == true){
         this.activeDevice.push(deviceId);
      }
      else if(this.liveData[deviceId] == false){
        this.activeDevice.splice(this.activeDevice.indexOf(deviceId), 1)
      }

       localStorage.setItem('activeDevice', this.activeDevice)
       this.liveDataService.sendMessage('activeDevice', JSON.stringify(this.activeDevice));

       console.log("active device:   2------->  ", this.activeDevice )
    })

  
    this.liveData[deviceId] = turnOn;

    // console.log("getacticeDevices: ", getacticeDevices)
    this.livedataDevice.push(this.liveData[deviceId]);
    

    const socketData = {
      deviceId: this.devices[index].deviceId,
      turnOn: this.liveData[deviceId]
    };

    this.liveDataService.sendMessage('mqtt_set', JSON.stringify(socketData));
    this.liveDataService.sendMessage('activeDevice', JSON.stringify(this.activeDevice));

    
  }

  ngOnDestroy() {
    this.connection.unsubscribe();
  }
};
