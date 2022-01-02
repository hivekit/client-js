import { WebSocket as NodeWebSocket } from 'ws'
import HivekitClient from './hivekit-client'
HivekitClient.prototype.WsConstructor = NodeWebSocket;
export default HivekitClient;