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
      api_timeout: 2000
    });

    if (this.hasCapability('onoff')) {
      this.registerCapabilityListener('onoff', async (value, opts) => this._api.setPowerStatus(value));
    }
    this.registerCapabilityListener('volume_set', value => this.onSetVolume(value));
    this.registerCapabilityListener('volume_mute', () => this.onVolumeMute());
    this.registerCapabilityListener('volume_up', value => this.onVolumeUp());
    this.registerCapabilityListener('volume_down', value => this.onVolumeDown());
    this.registerCapabilityListener('samsung_wam_func', value => this.onSetInputSource(value));

    this.addFetchTimeout(1);
    this.log('device initialized');
  }

  async updateIpAddress(address) {
    this._api.updateIpAddress(address);
    await this.setStoreValue('ipaddress', address);
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
    this.updateIpAddress(discoveryResult.address);
    await this._api.getInfo(discoveryResult.address);
  }

  onDiscoveryAddressChanged(discoveryResult) {
    this.log('onDiscoveryAddressChanged', discoveryResult);
    this.updateIpAddress(discoveryResult.address);
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
      let settings = await this.getSettings();
      interval = settings.poll_interval || 30;
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
      const state = await this._api.getState();
      this.log('state', state);
      let settings = await this.getSettings();
      this.setCapabilityValue('volume_set', state.volume / settings.max_volume).catch(err => this.log(err));
      this.setCapabilityValue('volume_mute', state.muted).catch(err => this.log(err));
      this.setCapabilityValue('samsung_wam_func', state.func).catch(err => this.log(err));
    } catch (err) {
      this.log('fetchState error', err);
    } finally {
      this.addFetchTimeout();
    }
  }

  onUpdateValues(device) {
  }

  async onSetVolume(value) {
    try {
      this.clearFetchTimeout();
      let settings = await this.getSettings();
      return this._api.setVolume(Math.round(value * settings.max_volume));
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

};
