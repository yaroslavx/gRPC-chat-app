import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { ProtoGrpcType } from './proto/random';

const PORT = 8000;
const PROTO_FILE = './proto/random.proto';

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE));
const grpcObj = grpc.loadPackageDefinition(
  packageDef
) as unknown as ProtoGrpcType;
const client = new grpcObj.randomPackage.Random(
  `0.0.0.0:${PORT}`,
  grpc.credentials.createInsecure()
);

const deadline = new Date();
deadline.setSeconds(deadline.getSeconds() + 5);
client.waitForReady(deadline, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  onClientReady();
});

function onClientReady() {
  // client.PingPong({ message: 'Ping' }, (err, result) => {
  //   if (err) {
  //     console.error(err);
  //     return;
  //   }
  //   console.log(result);
  // });

  // const stream = client.RandomNumbers({ maxVal: 101 });
  // stream.on('data', (chunk) => {
  //   console.log(chunk);
  // });
  // stream.on('end', () => {
  //   console.log('stream closed');
  // });

  const stream = client.TodoList((err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(result);
  });
  stream.write({ todo: 'Do something cool', status: 'Always' });
  stream.write({ todo: 'Do something cool again', status: 'Always too' });
  stream.write({ todo: 'Do something awesome', status: 'Always again' });
  stream.end();
}
