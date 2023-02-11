// @ts-ignore
//const prod = !(process.env.NODE_ENV === 'development');
const prod = true;
console.log("Production mode: " + prod);
export const baseURL = prod ? "update.sineware.ca" : "localhost:8080";
export const httpURL = (prod ? "https://" : "http://") + baseURL;
export const wsURL = (prod ? "wss://" : "ws://") + baseURL + "/gateway";