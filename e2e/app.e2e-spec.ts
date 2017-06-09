import { MonitoringControlPage } from './app.po';

describe('monitoring-control App', () => {
  let page: MonitoringControlPage;

  beforeEach(() => {
    page = new MonitoringControlPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
