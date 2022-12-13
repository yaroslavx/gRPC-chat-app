import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/random';
import { ChatServiceHandlers } from './proto/chatPackage/ChatService';

const PORT = 8000;
const PROTO_FILE = './proto/random.proto';

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE));
const grpcObj = grpc.loadPackageDefinition(
  packageDef
) as unknown as ProtoGrpcType;
const randomPackage = grpcObj.chatPackage;

function main() {
  const server = getServer();
  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        return console.error(err);
      }
      console.log(`Server started on port ${port}`);
      server.start();
    }
  );
}

// const callObjByUsername = new Map<
//   string,
//   grpc.ServerDuplexStream<ChatRequest, ChatResponse>
// >();

function getServer() {
  const server = new grpc.Server();
  server.addService(randomPackage.ChatService.service, {
    ChatInitiate: (call, callback) => {
      const sessionName = call.request.name || '';
      const avatar_url = call.request.avatarUrl || '';

      if (!sessionName) return callback(new Error('Name is required'));

      callback(null, { id: Math.floor(Math.random() * 10000) });
    },
  } as ChatServiceHandlers);

  return server;
}

main();
