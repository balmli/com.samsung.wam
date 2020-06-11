'use strict';

const SamsungDevice = require('../../lib/SamsungDevice');

module.exports = class SamsungWAMDevice extends SamsungDevice {

  async updateDiscovery(discoveryResult) {
    this._api.updateIpAddress(discoveryResult.address);
    await this.setStoreValue('ipaddress', discoveryResult.address);
    this._api.updateLocation(discoveryResult.headers.location);
    await this.setStoreValue('location', discoveryResult.headers.location);
  }

  onDiscoveryResult(discoveryResult) {
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    this.log('onDiscoveryAvailable', discoveryResult);
    this.updateDiscovery(discoveryResult);
    await this._api.getInfo();
  }

  onDiscoveryAddressChanged(discoveryResult) {
    this.log('onDiscoveryAddressChanged', discoveryResult);
    this.updateDiscovery(discoveryResult);
  }

};
