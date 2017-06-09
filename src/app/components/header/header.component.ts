import { Component } from '@angular/core';

@Component({
  selector: 'header-component',
  template: `
    <header>
        <div class="container noTopPadding">
            <div class="floatLeft productTitle productTitleWide">
                <a [routerLink]="['/']">
                <img src="assets/img/iotp.png" class="floatLeft" style="width: 30px; margin-right: 15px; margin-top: 9px;">
                Plant Floor Monitor - <strong>Conveyor Status</strong>
                </a>
            </div>
            
            <div class="floatRight">
                <p class="floatRight medium-show large-hide">
                    <a href="#" class="btn btn-demo em-Modal-Call" rel="loginModal">
                        <i class="icon-menu"></i>
                    </a>
                </p>
            </div>
        </div>
    </header>`
})

export class HeaderComponent {};