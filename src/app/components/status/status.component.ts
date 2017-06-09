import { Component, OnInit }  from '@angular/core';
import { IBMIoTPService }            from '../../services/iotp/ibmIoTP.service'

@Component({
  templateUrl: './status.component.html',
  styles: [`
    .list {
        line-height: 30px;
    }
  `]
})

export class StatusComponent implements OnInit {
  errorMessage: string;
  iotpStatus;
  iotpStatusKeys;

  constructor (private ibmIoTP: IBMIoTPService) {}

  ngOnInit() {
    this.ibmIoTP.getStatus().then(
          iotpStatus => {
            console.log("Status:", iotpStatus);

            var keys = Object.keys(iotpStatus);
            if (keys.length > 0) {
                this.iotpStatus = iotpStatus[keys[0]];

                this.iotpStatusKeys = Object.keys(this.iotpStatus);
            } else {
                this.iotpStatus = [];

                this.iotpStatusKeys = [];
            }
            
          },
          error =>  this.errorMessage = <any>error);
  }

  cleanCamelCase(text: string) {
    return text.replace(/([A-Z])/g, ' $1')
               .replace(/^./, function(str){ return str.toUpperCase(); })
  }
};