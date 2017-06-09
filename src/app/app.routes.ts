import { ModuleWithProviders }  from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DevicesComponent } from './components/devices/devices.component';
import { StatusComponent } from './components/status/status.component';

export const routes: Routes = [
  { path: '', redirectTo: '/devices', pathMatch: 'full' },
  { path: 'devices', component: DevicesComponent },
  { path: 'status', component: StatusComponent }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);