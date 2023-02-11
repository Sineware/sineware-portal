import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

import { ws } from "./ws";

export function useWS<T>(action, initialPayload: object | null = null): [T | undefined, (payload: object | null) => void] {
    let [result, setResult] = useState<T>();
    let [payload, setPayload] = useState(initialPayload);
    // generate random id
    useEffect(() => {
        if (payload === null) return;
        let id = uuidv4();
        let msg = { action, payload, id };
        console.log("Sending message: " + JSON.stringify(msg));
        ws.send(JSON.stringify(msg));
        const listener = (e) => {
            let msg = JSON.parse(e.data);
            if (msg.id === id) {
                setResult(msg.payload);
            }
        }
        ws.addEventListener("message", listener);
        console.log("Added listener for " + action + " with id " + id);
        return () => {
            console.log("Removed listener for " + action + " with id " + id);
            ws.removeEventListener("message", listener);
        }
    }, [action, payload]);
    return [result, setPayload];
}

export function useWSListener<T>(action, callback: (payload: T) => void) {
    useEffect(() => {
        const listener = (e) => {
            console.log("Received message: " + e.data)
            let msg = JSON.parse(e.data);
            if (msg.action === action) {
                callback(msg.payload);
            }
        }
        ws.addEventListener("message", listener);
        console.log("Added listener for " + action);
        return () => {
            console.log("Removed listener for " + action);
            ws.removeEventListener("message", listener);
        }
    }, [action, callback]);
}