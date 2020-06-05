'use strict';

const Homey = require('homey');

module.exports = class SamsungWAMApp extends Homey.App {

  onInit() {
    this.log('SamsungWAMApp is running...');

    new Homey.FlowCardAction('samsung_wam_func')
      .register()
      .registerRunListener(args => args.device.onSetInputSource(args.inputSource.id, true))
      .getArgument('inputSource')
      .registerAutocompleteListener((query, args) => args.device.onInputSourceAutocomplete(query, args));

    new Homey.FlowCardAction('samsung_wam_playurl')
      .register()
      .registerRunListener(args => args.device.setUrlPlayback(args.url));

  }

};
