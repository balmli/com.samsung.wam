'use strict';

const Homey = require('homey');

module.exports = class SamsungWAMApp extends Homey.App {

  onInit() {
    this.log('SamsungWAMApp is running...');

    this.homey.flow.getActionCard('samsung_wam_func')
      .registerRunListener(args => args.device.onSetInputSource(args.inputSource.id, true))
      .getArgument('inputSource')
      .registerAutocompleteListener((query, args) => args.device.onInputSourceAutocomplete(query, args));

    this.homey.flow.getActionCard('samsung_wam_playurl')
      .registerRunListener(args => args.device.setUrlPlayback(args.url));

  }

};
