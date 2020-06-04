'use strict';

const Homey = require('homey');
const SamsungWAMApi = require('./samsung_wam_api');

module.exports = class SamsungWAMDriver extends Homey.Driver {

  onInit() {
    this.log('SamsungWAMDriver has been initialized');
  }

  async onPairListDevices(data, callback) {

    const samsungWAMApi = new SamsungWAMApi({
      logger: this.log,
      api_timeout: 2000
    });

    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = Object.values(discoveryStrategy.getDiscoveryResults());

    const devices = [];
    for (let dr in discoveryResults) {
      let discoveryResult = discoveryResults[dr];

      this.log('Discovery', {
        id: discoveryResult.id,
        address: discoveryResult.address,
        location: discoveryResult.headers.location,
        server: discoveryResult.headers.server,
      });

      samsungWAMApi.updateIpAddress(discoveryResult.address);
      const deviceInfo = await samsungWAMApi.getInfo(undefined, true);

      if (deviceInfo) {

        let capabilities = [
          "volume_set",
          "volume_up",
          "volume_down",
          "volume_mute",
          "samsung_wam_func"
        ];

        try {
          await samsungWAMApi.setPowerStatus(true);
          capabilities = ["onoff"].concat(capabilities);
        } catch (err) {
          this.log(`On / off is not supported for ${discoveryResult.address}`);
        }

        devices.push({
          name: deviceInfo.name,
          data: {
            id: discoveryResult.id,
            type: deviceInfo.device.type,
            networkType: deviceInfo.device.networkType
          },
          capabilities: capabilities,
          store: {
            ipaddress: discoveryResult.address
          }
        });
      }
    }

    this.log('Found devices', devices);
    callback(null, devices);
  }

};
