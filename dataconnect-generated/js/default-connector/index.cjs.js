const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'dbcopy-final',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

