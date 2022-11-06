'use strict';

const Homey = require('homey');
const SamsungWAMApi = require('../../lib/samsung_wam_api');

module.exports = class SamsungWAMDriver extends Homey.Driver {

  onInit() {
    this.log('SamsungWAMDriver has been initialized');
  }

  async onPairListDevices() {

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
      samsungWAMApi.updateLocation(discoveryResult.headers.location);

      const deviceInfo = await samsungWAMApi.getInfo(undefined, true);

      if (deviceInfo) {

        const ports = [55001, 56001];
        let port;
        for (let idx = 0; idx < ports.length; idx++) {
          try {
            port = ports[idx];
            samsungWAMApi.updatePort(port);
            const softwareVersion = await samsungWAMApi.getSoftwareVersion();
            this.log(`Found device on: ${discoveryResult.address}:${port}`);
            break;
          } catch (err) {
            port = null;
            this.log(`No response from: ${discoveryResult.address}:${port}`, err);
          }
        }

        if (port) {
          const locationInfo = await samsungWAMApi.getLocationInfo();

          let onOff = false;
          try {
            await samsungWAMApi.setPowerStatus(true);
            onOff = true;
          } catch (err) {
            this.log(`On / off is not supported for ${discoveryResult.address}`);
          }

          devices.push({
            name: deviceInfo.name,
            data: {
              id: discoveryResult.id,
              type: deviceInfo.device.type,
              modelName: locationInfo.root.device[0].modelName[0],
              networkType: deviceInfo.device.networkType,
              onOff: onOff
            },
            store: {
              ipaddress: discoveryResult.address,
              port: port,
              location: discoveryResult.headers.location
            }
          });
        }
      }
    }

    this.log('Found devices', devices);
    return devices;
  }

};
