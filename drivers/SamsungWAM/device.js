'use strict';

const Homey = require('homey');
const SamsungWAMApi = require('./samsung_wam_api');

module.exports = class SamsungWAMDevice extends Homey.Device {

  async onInit() {
    this._api = new SamsungWAMApi({
      device: this,
      logger: this.log,
      onUpdateValues: this.onUpdateValues,
      ip_address: this.getStoreValue('ipaddress'),
      location: this.getStoreValue('location'),
      api_timeout: 2000
    });

    this.registerCapabilityListener('onoff', value => this.onSetPowerStatus(value));
    this.registerCapabilityListener('volume_set', value => this.onSetVolume(value));
    this.registerCapabilityListener('volume_mute', () => this.onVolumeMute());
    this.registerCapabilityListener('volume_up', value => this.onVolumeUp());
    this.registerCapabilityListener('volume_down', value => this.onVolumeDown());
    this.registerCapabilityListener('samsung_wam_func', value => this.onSetInputSource(value));

    this.addFetchTimeout(1);
    this.log('device initialized', this.getData());
  }

  async updateDiscovery(discoveryResult) {
    this._api.updateIpAddress(discoveryResult.address);
    await this.setStoreValue('ipaddress', discoveryResult.address);
    this._api.updateLocation(discoveryResult.headers.location);
    await this.setStoreValue('location', discoveryResult.headers.location);
  }

  onAdded() {
    this.log('device added', this.getData());
    if (!this.getData().onOff) {
      this.setCapabilityValue('onoff', true).catch(err => this.log(err));
    }
  }

  onDeleted() {
    this.clearFetchTimeout();
    this.log('device deleted');
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

  async onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
    if (changedKeysArr.includes('poll_interval')) {
      this.addFetchTimeout();
    }

    callback(null, true);
  }

  async addFetchTimeout(seconds) {
    this.clearFetchTimeout();
    let interval = seconds;
    if (!interval) {
      interval = this.getSetting('poll_interval') || 30;
    }
    this.fetchTimeout = setTimeout(() => this.fetchState(), 1000 * interval);
  }

  clearFetchTimeout() {
    if (this.fetchTimeout) {
      clearTimeout(this.fetchTimeout);
      this.fetchTimeout = undefined;
    }
  }

  async fetchState() {
    try {
      if (this.getCapabilityValue('onoff') || this.getData().onOff) {
        const state = await this._api.getState(this.getData().onOff);
        this.log('state', state);
        if (this.getData().onOff) {
          this.setCapabilityValue('onoff', state.powerStatus).catch(err => this.log(err));
        }
        if (!this.getData().onOff || this.getData().onOff && state.powerStatus) {
          this.setCapabilityValue('volume_set', state.volume / this.getSetting('max_volume')).catch(err => this.log(err));
          this.setCapabilityValue('volume_mute', state.muted).catch(err => this.log(err));
          this.setCapabilityValue('samsung_wam_func', state.func).catch(err => this.log(err));
        }
      }
    } catch (err) {
      this.log('fetchState error', err);
    } finally {
      this.addFetchTimeout();
    }
  }

  onUpdateValues(device) {
  }

  async onSetPowerStatus(value) {
    if (this.getData().onOff) {
      try {
        this.clearFetchTimeout();
        return this._api.setPowerStatus(value);
      } finally {
        this.addFetchTimeout();
      }
    }
  }

  async onSetVolume(value) {
    try {
      this.clearFetchTimeout();
      return this._api.setVolume(Math.round(value * this.getSetting('max_volume')));
    } finally {
      this.addFetchTimeout();
    }
  }

  async onVolumeMute() {
    try {
      this.clearFetchTimeout();
      return this._api.volumeMute();
    } finally {
      this.addFetchTimeout();
    }
  }

  async onVolumeUp() {
    try {
      this.clearFetchTimeout();
      return this._api.volumeUp();
    } finally {
      this.addFetchTimeout();
    }
  }

  async onVolumeDown() {
    try {
      this.clearFetchTimeout();
      return this._api.volumeDown();
    } finally {
      this.addFetchTimeout();
    }
  }

  async onSetInputSource(inputSource, setCap) {
    try {
      this.clearFetchTimeout();
      if (await this._api.setFunc(inputSource) && setCap) {
        this.setCapabilityValue('samsung_wam_func', inputSource).catch(err => this.log(err));
      }
    } finally {
      this.addFetchTimeout();
    }
  }

  async setUrlPlayback(url) {
    try {
      return this._api.setUrlPlayback(url)
    } catch (err) {
      this.log('setUrlPlayback error', err);
    }
  }

  async onInputSourceAutocomplete(query, args) {
    let inputSources;
    switch (this.getData().modelName) {
      case 'HW-MS650':
      case 'HW-MS6500':
        inputSources = [
          { id: "optical", name: "D.IN" },
          { id: "aux", name: "Aux" },
          { id: "hdmi", name: "HDMI" },
          { id: "bt", name: "BT" },
          { id: "wifi", name: "Wifi" },
        ];
        break;

      case 'HW-K950':
      case 'HW-MS750':
      case 'HW-MS7500':
        inputSources = [
          { id: "optical", name: "D.IN" },
          { id: "aux", name: "Aux" },
          { id: "hdmi1", name: "HDMI1" },
          { id: "hdmi2", name: "HDMI2" },
          { id: "bt", name: "BT" },
          { id: "wifi", name: "Wifi" },
        ];
        break;

      case 'HW-H750':
      case 'HW-J650':
      case 'HW-J7500':
      case 'HW-J8500':
      case 'HW-K650':
        inputSources = [
          { id: "optical", name: "D.IN" },
          { id: "aux", name: "Aux" },
          { id: "hdmi", name: "HDMI" },
          { id: "bt", name: "BT" },
          { id: "wifi", name: "Wifi" },
          { id: "usb", name: "USB" },
          { id: "soundshare", name: "Soundshare" },
        ];
        break;

      default:
        inputSources = [
          { id: "bt", name: "BT" },
          { id: "wifi", name: "Wifi" },
          { id: "soundshare", name: "Soundshare" }
        ];
        break;
    }
    return Promise.resolve((inputSources).map(is => {
      return {
        id: is.id,
        name: is.name
      };
    }).filter(result => {
      return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
    }));
  }

};
