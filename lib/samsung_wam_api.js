'use strict';

const http = require('http.min');
const xml2js = require('xml2js');


module.exports = class SamsungWAMApi {

  constructor(config) {
    this._config = config;
    this._device = config.device;
    this._logger = config.logger;
    this._onUpdateValues = config.onUpdateValues;
  }

  updateIpAddress(address) {
    this._config.ip_address = address;
  }

  updatePort(port) {
    this._config.port = port;
  }

  updateLocation(location) {
    this._config.location = location;
  }

  async getInfo(ipAddress, skipErrors = false) {
    try {
      const ip_address = ipAddress || this._config.ip_address;
      const data = await http.get({
        uri: `http://${(ip_address)}:8001/api/v2/`,
        timeout: this._config.api_timeout,
        json: true
      });
      if (data.data && data.response.statusCode === 200) {
        this._logger(`Get info: ${ip_address}`, data.data);
        if (data.data.type === 'Samsung Speaker') {
          return data.data;
        } else {
          throw new Error(`Unsupported type: ${ip_address} -> ${data.data.type}`);
        }
      } else {
        throw new Error(`Get info failed: ${data.response.statusCode} ${data.response.statusMessage}`);
      }
    } catch (err) {
      if (skipErrors) {
        return;
      }
      throw err;
    }
  }

  async getLocationInfo() {
    try {
      const data = await http.get({
        uri: this._config.location,
        timeout: this._config.api_timeout
      });
      if (data.data && data.response.statusCode === 200) {
        this._logger(`Get location info: ${this._config.location}`, data.data);
        return await xml2js.parseStringPromise(data.data);
      } else {
        throw new Error(`Get location info failed: ${data.response.statusCode} ${data.response.statusMessage}`);
      }
    } catch (err) {
      throw err;
    }
  }

  async get(cmd) {
    let data;
    this._logger('GET', cmd);
    try {
      data = await http.get({
        uri: `http://${this._config.ip_address}:${this._config.port || 55001}/UIC?cmd=${encodeURIComponent(cmd)}`,
        timeout: this._config.api_timeout
      });
    } catch (err) {
      throw new Error(err);
    }
    if (data.data && data.response.statusCode === 200) {
      return await xml2js.parseStringPromise(data.data);
    } else {
      throw new Error(`get failed: ${data.response.statusCode} ${data.response.statusMessage}`);
    }
  }

  async getState(onOffCapability) {
    const powerStatus = onOffCapability ? await this.getPowerStatus() : undefined;
    return {
      powerStatus: powerStatus,
      volume: powerStatus !== false ? await this.getVolume() : undefined,
      muted: powerStatus !== false ? await this.getMuted() : undefined,
      func: powerStatus !== false ? await this.getFunc() : undefined
    }
  }

  async getSpkName() {
    const spkname = await this.get('<pwron>on</pwron><name>GetSpkName</name>');
    return spkname.UIC.response[0].spkname[0];
  }

  async getApInfo() {
    const apInfo = await this.get('<pwron>on</pwron><name>GetApInfo</name>');
    return { mac: apInfo.UIC.response[0].mac[0], networkType: apInfo.UIC.response[0].connectiontype[0] };
  }

  async getSoftwareVersion() {
    const softwareVersion = await this.get('<pwron>on</pwron><name>GetSoftwareVersion</name>');
    return softwareVersion.UIC.response[0].version[0];
  }

  async getPowerStatus() {
    const powerStatus = await this.get('<pwron>on</pwron><name>GetPowerStatus</name>');
    return powerStatus.UIC.response[0].powerStatus[0] !== '0';
  }

  async setPowerStatus(state) {
    this._logger('setPowerStatus', state);
    await this.get(`<pwron>on</pwron><name>SetPowerStatus</name><p type="dec" name="powerstatus" val="${state ? '1' : '0'}"/>`);
  }

  async setSleepTimer(timer) {
    await this.get(`<name>SetSleepTimer</name><p type="str" name="option" val="start"/><p type="dec" name="sleeptime" val="${timer}"/>`);
  }

  async getFunc() {
    const funcStatus = await this.get('<pwron>on</pwron><name>GetFunc</name>');
    return funcStatus.UIC.response[0].function[0];
  }

  async setFunc(func) {
    const current = await this.getFunc();
    if (current !== func) {
      this._logger('setFunc', func);
      await this.get(`<pwron>on</pwron><name>SetFunc</name><p type="str" name="function" val="${func}"/>`);
      return true;
    }
  }

  async getVolume() {
    const volumeStatus = await this.get('<pwron>on</pwron><name>GetVolume</name>');
    return volumeStatus.UIC.response[0].volume ? parseInt(volumeStatus.UIC.response[0].volume[0]) : 0;
  }

  async setVolume(volume) {
    await this.get(`<pwron>on</pwron><name>SetVolume</name><p type="dec" name="volume" val="${volume}"/>`);
  }

  async volumeUp() {
    let volume = await this.getVolume();
    await this.setVolume(Math.min(volume + 1, 100));
  }

  async volumeDown() {
    let volume = await this.getVolume();
    await this.setVolume(Math.max(volume - 1, 0));
  }

  async getMuted() {
    const muteStatus = await this.get('<pwron>on</pwron><name>GetMute</name>');
    return muteStatus.UIC.response[0].mute[0] === 'on';
  }

  async setMuted(muted) {
    await this.get(`<pwron>on</pwron><name>SetMute</name><p type="str" name="mute" val="${muted ? 'on' : 'off'}"/>`);
  }

  async volumeMute() {
    const muted = await this.getMuted();
    await this.setMuted(!muted);
  }

  async setUrlPlayback(url) {
    await this.get(`<pwron>on</pwron><name>SetUrlPlayback</name><p type="cdata" name="url" val="empty"><![CDATA[${url}]]></p><p type="dec" name="buffersize" val="0"/><p type="dec" name="seektime" val="0"/><p type="dec" name="resume" val="1"/>`);
  }

};