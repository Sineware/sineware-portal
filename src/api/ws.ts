import { v4 as uuidv4 } from 'uuid';
import { APIUser } from "../types/APITypes";
import { wsURL } from "./config";
export let ws: WebSocket;

export function connect(token, setError): Promise<APIUser> {
    // return promise
    return new Promise((resolve, reject) => {
        if (ws) {
            //reject(new Error("Already connected"));
            return;
        }
        ws = new WebSocket(wsURL);
        ws.onmessage = (event) => {
            console.log(event.data);
            let msg = JSON.parse(event.data);
            switch (msg.action) {
                case "hello": {
                    console.log("Sending Hello...")
                    ws.send(JSON.stringify({ action: "hello", payload: { 
                        clientType: "user",
                        accessToken: token
                    }}));
                } break;
                case "result": {
                    console.log("Result:", msg.payload);
                    if(msg.payload.status) {
                        resolve(msg.payload.data);
                    } else {
                        reject(new Error(msg.payload.data.msg));
                    }
                } break;
                case "error": {
                    console.log("Error:", msg.payload);
                    setError(msg.payload.msg);
                } break;
                default:
                    console.log("Unknown action: " + msg.action);
            }
        }
    });
}

export function callWS(action: string, payload: any, promise: boolean = true): Promise<any> {
    return new Promise ((resolve, reject) => {
        let id = uuidv4();
        let msg = { action, payload, id };
        //console.log("[Call] Sending message: " + JSON.stringify(msg));
        if(promise) {
          const listener = (e: any) => {
              let msg = JSON.parse(e.data);
              if (msg.id === id) {
                  if(msg.payload.status) {
                      resolve(msg.payload.data);
                  } else {
                      reject(new Error(msg.payload.data.msg));
                  }
                  ws.removeEventListener("message", listener);
              }
          }
          ws.addEventListener("message", listener);
        }
        ws.send(JSON.stringify(msg));
        if(!promise) resolve({});
    });
}