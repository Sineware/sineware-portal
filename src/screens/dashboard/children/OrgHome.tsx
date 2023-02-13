import React, { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWS } from "../../../api/Hooks";
import { AppContext } from "../../../state/AppContext";

/*
{"status":true,"data":[{"organization_id":2,"domain":"seshan.xyz","uuid":"DBEF02C9-9A25-4604-B7F9-CA2F6753E0BC","id":1,"type":"static","name":"Seshan's Website"},{"organization_id":2,"domain":"localhost:80","uuid":"DBEF02C9-9A25-4604-B7F9-CA2F6753E0BC","id":2,"type":"static","name":"Seshan's Website localhost"}],"forAction":"get-org-websites"}
*/
export function DashboardOrgHome() {
    const { orgUUID: uuid } = useParams();
    const context = useContext(AppContext);
    const [orgWebsites, setOrgWebsitesPayload] = useWS<any>("get-org-websites", {uuid: uuid});
    const [orgDevices, setOrgDevicesPayload] = useWS<any>("get-org-devices", {uuid: uuid});
    const [orgInfo, setOrgInfoPayload] = useWS<any>("get-org", {uuid: uuid});
    let navigate = useNavigate();
    useEffect(() => {
        setOrgWebsitesPayload({uuid: uuid});
        setOrgDevicesPayload({uuid: uuid});
        setOrgInfoPayload({uuid: uuid});
    }, [uuid]);
    return (
        <div>
            <h1>Dashboard</h1>
            <strong>Organization</strong>
            <div>UUID: {orgInfo?.data.uuid}</div>
            <div>Tier: {orgInfo?.data.tier}</div>
            <div>Device Access Token: <pre id={"device-token"} onClick={() => {
                let token = document.getElementById("device-token");
                if (token) {
                    if (token.innerText === "Press to show") {
                        token.innerText = orgInfo?.data.device_token;
                    } else {
                        token.innerText = "Press to show";
                    }
                }
            }}>Press to show</pre></div>
            <br />
            <strong>Connected Cloud Devices</strong>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Manage</th>
                    </tr>
                </thead>
                <tbody>
                    {orgDevices?.data.filter(o => o.type !== "user").map((device) => {
                        return (
                            <tr>
                                <td>{device.name} ({device.uuid})</td>
                                <td>{device.type}</td>
                                <td><button onClick={() => {
                                    navigate(`/dashboard/${uuid}/prolinux/${device.uuid}`);
                                }}>Open</button></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {orgDevices?.data.filter(o => o.type !== "user").length === 0 ? <center>No devices are currently connected.</center> : null}

            <strong>Websites</strong>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Domain</th>
                        <th>Type</th>
                        <th>Manage</th>
                    </tr>
                </thead>
                <tbody>
                    {orgWebsites?.data.map((website) => {
                        return (
                            <tr key={website.name}>
                                <td>{website.name}</td>
                                <td>{website.domain}</td>
                                <td>{website.type}</td>
                                <td><button>Open</button></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {orgWebsites?.data.length === 0 ? <center>No websites have been created.</center> : null}
        </div>
    );
}