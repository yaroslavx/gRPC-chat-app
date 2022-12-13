import { useEffect } from "react";
import { InitiateRequest } from './proto/random_pb'
import { ChatServiceClient } from './proto/RandomServiceClientPb'

function App() {
  useEffect(() => {
    const client = new ChatServiceClient("http://localhost:8080")
    const request = new InitiateRequest()
    request.setName('AwesomeName')
    client.chatInitiate(request, {}, (err, res) => {
      if (err) {
        return console.error(err)
      }
      console.log(res.toObject())
    })
  }, [])
  return (
    <div className="app">
      hi
    </div>
  );
}

export default App;
