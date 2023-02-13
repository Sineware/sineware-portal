import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FilterableTable from "react-filterable-table";
import { useWS, useWSListener } from "../../../../api/Hooks";
import { AppContext } from "../../../../state/AppContext";
import { callWS } from "../../../../api/ws";

// XTerm.js Wrapper div
/*class XTerm extends React.Component<{
    onInput?: (data: string) => void;
    write?: (data: string) => void;
}> {
    el;
    term;
    componentDidMount() {
        //@ts-ignore
        this.term = new Terminal();
        this.term.open(this.el);
        this.term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
        this.term.onData(data => {
            if (this.props.onInput) {
                this.props.onInput(data);
            }
        });
    }
    componentWillUnmount(): void {
        this.term.dispose();
    }

    render() {
        return <div ref={el => this.el = el} />;
    }
}*/

// convert the XTerm class to a function
function XTerm(props: {
    onInput?: (data: string) => void;
    deviceUUID?: string;
}) {
    const el = useRef(null);
    const term = useRef(null);
    useEffect(() => {
        //@ts-ignore
        term.current = new Terminal({
            cols: 80,
            rows: 30,
        });
        term.current.open(el.current);
        term.current.write('$ ')
        term.current.onData(data => {
            if (props.onInput) {
                props.onInput(btoa(data));
            }
        });
        return () => {
            term.current.dispose();
        }
    }, []);
    const termPut = useCallback((data: any) => {
        //console.log("device term: ", data);
        if (data.deviceUUID === props.deviceUUID) {
            if (data.fromDevice) {
                term.current.write(atob(data.text));
            }
        }
    }, [props.deviceUUID]);
    useWSListener("device-stream-terminal", termPut);
    return <div ref={el} />;
}

export function ProLinuxHome() {
    const { orgUUID: uuid, deviceUUID } = useParams();
    const navigate = useNavigate();
    const context = useContext(AppContext);
    const [logs, setLogs]: any = useState([])

    const log = useCallback((data: any) => {
        console.log("device log: ", data);
        setLogs((logs: any) => {
            return [...logs, data];
        });
    }, [setLogs]);
    useWSListener("device-log", log);

    const [orgDevices, setOrgDevicesPayload] = useWS<any>("get-org-devices", { uuid: uuid });
    const deviceInfo = orgDevices?.data?.find((device: any) => device.uuid === deviceUUID);
    console.log("deviceInfo: ", deviceInfo)


    const fields = [
        { name: 'from', displayName: "From", inputFilterable: true },
        { name: 'type', displayName: "Type", inputFilterable: true, exactFilterable: true },
        { name: 'msg', displayName: "Log", inputFilterable: true, exactFilterable: true }
    ];

    return (
        <div>
            <a onClick={() => navigate("/dashboard/" + uuid)}>{"<"} Back</a>
            <hr />
            <p>
                <b>Device</b> <b>({deviceUUID})</b>
                {typeof deviceInfo === "undefined" ? <div style={{color: 'red'}}>OFFLINE</div> : null}
                <div>Hostname: {deviceInfo?.name}</div>
                <div>Type: {deviceInfo?.type}</div>
            </p>
            <details>
                <summary>Device Terminal</summary>
                <XTerm onInput={(text) => {
                    callWS("device-stream-terminal", {
                        deviceUUID: deviceUUID,
                        fromDevice: false,
                        text
                    }, false)
                }} deviceUUID={deviceUUID} />
            </details>
            <details>
                <summary>Logs</summary>
                <FilterableTable
                    namespace="Logs"
                    data={logs}
                    fields={fields}
                    noRecordsMessage="There are no logs to display"
                    noFilteredRecordsMessage="No logs match your filters!"
                />
            </details>
            <details>
                <summary>Crash / Coredumps</summary>
                <p>Coming Soon!</p>
            </details>
        </div>
    );
}