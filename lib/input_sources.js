'use strict';

const LIST_1 = [
  { id: "optical", name: "D.IN" },
  { id: "aux", name: "Aux" },
  { id: "hdmi", name: "HDMI" },
  { id: "bt", name: "BT" },
  { id: "wifi", name: "Wifi" },
];

const LIST_2 = [
  { id: "optical", name: "D.IN" },
  { id: "aux", name: "Aux" },
  { id: "hdmi1", name: "HDMI1" },
  { id: "hdmi2", name: "HDMI2" },
  { id: "bt", name: "BT" },
  { id: "wifi", name: "Wifi" },
];

const LIST_3 = [
  { id: "optical", name: "D.IN" },
  { id: "hdmi", name: "HDMI" },
  { id: "bt", name: "BT" },
  { id: "wifi", name: "Wifi" },
];

const LIST_4 = [
  { id: "optical", name: "D.IN" },
  { id: "hdmi1", name: "HDMI1" },
  { id: "hdmi2", name: "HDMI2" },
  { id: "bt", name: "BT" },
  { id: "wifi", name: "Wifi" },
];

const LIST_5 = [
  { id: "optical", name: "D.IN" },
  { id: "aux", name: "Aux" },
  { id: "hdmi", name: "HDMI" },
  { id: "bt", name: "BT" },
  { id: "wifi", name: "Wifi" },
  { id: "usb", name: "USB" },
  { id: "soundshare", name: "Soundshare" },
];

const LIST_FALL_BACK = [
  { id: "optical", name: "D.IN" },
  { id: "aux", name: "Aux" },
  { id: "hdmi", name: "HDMI" },
  { id: "hdmi1", name: "HDMI1" },
  { id: "hdmi2", name: "HDMI2" },
  { id: "bt", name: "BT" },
  { id: "wifi", name: "Wifi" },
  { id: "usb", name: "USB" },
  { id: "soundshare", name: "Soundshare" },
];

const MODEL_TO_LIST_MAP = {
  'HW-MS560': 1,
  'HW-MS650': 1,
  'HW-MS6500': 1,
  'HW-MS660': 1,
  'HW-MS661': 1,
  'HW-N400': 1,

  'HW-K860': 2,
  'HW-K950': 2,
  'HW-K960': 2,
  'HW-MS750': 2,
  'HW-MS7500': 2,
  'HW-MS760': 2,
  'HW-MS761': 2,

  'HW-Q70R': 3,
  'HW-Q76R': 3,
  'HW-Q800T': 3,
  'HW-R550': 3,

  'HW-N850': 4,
  'HW-N960': 4,
  'HW-Q80R': 4,
  'HW-Q86R': 4,
  'HW-Q90R': 4,
  'HW-Q96R': 4,

  'HW-H750': 5,
  'HW-J650': 5,
  'HW-J7500': 5,
  'HW-J8500': 5,
  'HW-K650': 5
};

const LIST_MAP = {
  LIST_0: LIST_FALL_BACK,
  LIST_1: LIST_1,
  LIST_2: LIST_2,
  LIST_3: LIST_3,
  LIST_4: LIST_4,
  LIST_5: LIST_5
};

module.exports = {
  MODEL_TO_LIST_MAP: MODEL_TO_LIST_MAP,
  LIST_MAP: LIST_MAP
};