import ky from "ky";
import { httpURL } from "./config";
export async function login(username, password, totp) {
    let res = await ky.post(httpURL + "/login", { json: { username, password, totp } });
    return res.json();
}