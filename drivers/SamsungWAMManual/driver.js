'use strict';

const Homey = require('homey');
const SamsungWAMApi = require('../../lib/samsung_wam_api');

module.exports = class SamsungWAMDriver extends Homey.Driver {

  onInit() {
    this.log('SamsungWAMDriver has been initialized');

    this._api = new SamsungWAMApi({
      logger: this.log,
      api_timeout: 2000
    });
  }

  onPair(socket) {
    let self = this;

    socket.on('model_input', async (data, callback) => {
      this._api.updateIpAddress(data.ipaddress);
      this._api.updatePort(data.port);
      try {
        const speakerName = await this._api.getSpkName();
        const apInfo = await this._api.getApInfo();
        self.log(`Found speaker: ${data.ipaddress}:${data.port} -> ${speakerName}`, apInfo);

        let onOff = false;
        try {
          await this._api.setPowerStatus(true);
          onOff = true;
        } catch (err) {
          this.log(`On / off is not supported for ${data.ipaddress}`);
        }

        callback(null, {
          id: apInfo.mac,
          speakerName: speakerName,
          networkType: apInfo.networkType,
          onOff: onOff
        });

      } catch (err) {
        self.log(`Found no speaker: ${data.ipaddress}:${data.port}`, err);
        callback(err, null);
      }
    });

  }

};
