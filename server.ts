import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/random';
import { RandomHandlers } from './proto/randomPackage/Random';
import { TodoRequest } from './proto/randomPackage/TodoRequest';
import { TodoResponse } from './proto/randomPackage/TodoResponse';
import { ChatRequest } from './proto/randomPackage/ChatRequest';
import { ChatResponse } from './proto/randomPackage/ChatResponse';

const PORT = 8000;
const PROTO_FILE = './proto/random.proto';

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE));
const grpcObj = grpc.loadPackageDefinition(
  packageDef
) as unknown as ProtoGrpcType;
const randomPackage = grpcObj.randomPackage;

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

const todoList: TodoResponse = { data: [] };
const callObjByUsername = new Map<
  string,
  grpc.ServerDuplexStream<ChatRequest, ChatResponse>
>();

function getServer() {
  const server = new grpc.Server();
  server.addService(randomPackage.Random.service, {
    PingPong: (req, res) => {
      console.log(req.request);
      res(null, { message: 'Pong' });
    },
    RandomNumbers: (call) => {
      const { maxVal = 10 } = call.request;
      let count = 0;
      const interval = setInterval(() => {
        if (count > 9) {
          call.end();
          clearInterval(interval);
        }
        call.write({ num: Math.floor(Math.random() * maxVal) });
        count++;
      }, 500);
    },

    TodoList: (call, callback) => {
      call.on('data', (chunk: TodoRequest) => {
        console.log(chunk);
        todoList.data?.push(chunk);
      });

      call.on('end', () => {
        callback(null, { data: todoList.data });
      });
    },

    Chat: (call) => {
      call.on('data', (req) => {
        const username = call.metadata.get('username')[0] as string;
        const message = req.message;

        console.log(username, req.message);

        for (let [user, userCall] of callObjByUsername) {
          if (user !== username) {
            userCall.write({
              username,
              message,
            });
          }
        }

        if (!callObjByUsername.has(username)) {
          callObjByUsername.set(username, call);
        }
      });

      call.on('end', () => {
        const username = call.metadata.get('username')[0] as string;
        callObjByUsername.delete(username);

        for (let [user, userCall] of callObjByUsername) {
          userCall.write({
            username,
            message: `${username} has left the chat`,
          });
        }
        console.log(`${username} is ending his chat session`);

        call.write({
          username: 'Server',
          message: `See you later ${username}`,
        });

        call.end();
      });
    },
  } as RandomHandlers);

  return server;
}

main();
