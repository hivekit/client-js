import HivekitClient from './hivekit-client'
HivekitClient.prototype.WsConstructor = window.WebSocket;
export default HivekitClient;