'use strict';

const Homey = require('homey');
const SamsungWAMApi = require('./samsung_wam_api');
const { MODEL_TO_LIST_MAP, LIST_MAP } = require('./input_sources');

module.exports = class SamsungDevice extends Homey.Device {

  async onInit() {
    this._api = new SamsungWAMApi({
      device: this,
      logger: this.log,
      onUpdateValues: this.onUpdateValues,
      ip_address: this.getStoreValue('ipaddress'),
      port: this.getStoreValue('port'),
      location: this.getStoreValue('location'),
      api_timeout: 2000
    });

    await this.migrate();
    await this.updateInputSourceCapability();

    this.registerCapabilityListener('onoff', value => this.onSetPowerStatus(value));
    this.registerCapabilityListener('volume_set', value => this.onSetVolume(value));
    this.registerCapabilityListener('volume_mute', () => this.onVolumeMute());
    this.registerCapabilityListener('volume_up', value => this.onVolumeUp());
    this.registerCapabilityListener('volume_down', value => this.onVolumeDown());
    this.registerCapabilityListener(this._inputSourceCapability, value => this.onSetInputSource(value));

    this.addFetchTimeout(1);
    this.log('device initialized', this.getData());
  }

  onAdded() {
    this.log('device added', this.getData());
    if (!this.getData().onOff) {
      this.setCapabilityValue('onoff', true).catch(err => this.log(err));
    }
  }

  onDeleted() {
    this._deleted = true;
    this.clearFetchTimeout();
    this.log('device deleted');
  }

  async migrate() {
    if (this.getClass() !== 'speaker') {
      await this.setClass('speaker');
    }
  }

  async updateInputSourceCapability() {
    let inputSourceNo = MODEL_TO_LIST_MAP[this.getData().modelName] ?
      MODEL_TO_LIST_MAP[this.getData().modelName] : 0;
    this._inputSourceCapability = `samsung_wam_func_${inputSourceNo}`;

    let curInputSourceNo = this.getStoreValue('inputSourceNo');
    if (curInputSourceNo === null || curInputSourceNo === undefined || curInputSourceNo !== inputSourceNo) {
      for (let i = 0; i < Object.getOwnPropertyNames(LIST_MAP).length; i++) {
        const capability = `samsung_wam_func_${i}`;
        if (i !== inputSourceNo && this.hasCapability(capability)) {
          try {
            await this.removeCapability(capability);
          } catch (err) {
            this.log(`removeCapability ERROR: ${capability}`, err);
          }
        }
      }
      if (!this.hasCapability(this._inputSourceCapability)) {
        await this.addCapability(this._inputSourceCapability);
      }
      await this.setStoreValue('inputSourceNo', inputSourceNo);
      this.log('updated inputSourceNo', inputSourceNo, this._inputSourceCapability);
    }
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (changedKeys.includes('poll_interval')) {
      this.addFetchTimeout();
    }
  }

  async addFetchTimeout(seconds) {
    if (this._deleted) {
      return;
    }
    this.clearFetchTimeout();
    let interval = seconds;
    if (!interval) {
      interval = this.getSetting('poll_interval') || 30;
    }
    this.fetchTimeout = this.homey.setTimeout(() => this.fetchState(), 1000 * interval);
  }

  clearFetchTimeout() {
    if (this.fetchTimeout) {
      this.homey.clearTimeout(this.fetchTimeout);
      this.fetchTimeout = undefined;
    }
  }

  async fetchState() {
    if (this._deleted) {
      return;
    }
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
          this.setCapabilityValue(this._inputSourceCapability, state.func).catch(err => this.log(err));
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
    try {
      this.clearFetchTimeout();
      if (this.getData().onOff) {
        this._api.setPowerStatus(value);
      } else {
        if (value) {
          // Get volume to turn on
          try {
            this._api.getVolume();
          } catch (err) {
            this.log('turn on', err);
          }
        } else {
          // Sleep timer for 1 sec to turn off
          this._api.setSleepTimer(1);
        }
      }
    } finally {
      this.addFetchTimeout();
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
        this.setCapabilityValue(this._inputSourceCapability, inputSource).catch(err => this.log(err));
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
    const inputSources = LIST_MAP[`LIST_${this.getStoreValue('inputSourceNo')}`];

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
