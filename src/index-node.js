import HivekitClient from './hivekit-client.js'
HivekitClient.prototype.WsConstructor = globalThis.WebSocket;
export default HivekitClient;