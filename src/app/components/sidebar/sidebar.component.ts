import { Component } from '@angular/core';

@Component({
  selector: 'sidebar-component',
  template: `
    <aside class="sidebar">
        <ul class="sidebarItems">
            <li [routerLinkActive]="['active']" *ngFor="let item of routes;">
                <a [routerLink]="[item.link]">
                    <i class="icon-location"></i>{{item.title}}
                </a>
            </li>
        </ul>
    </aside>`
})

export class SidebarComponent {
    routes = [
        {title: 'Devices', link: '/devices'},
        {title: 'Status', link: '/status'}
    ];
};