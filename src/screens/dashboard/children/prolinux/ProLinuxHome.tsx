import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FilterableTable from "react-filterable-table";
import { useWS, useWSListener } from "../../../../api/Hooks";
import { AppContext } from "../../../../state/AppContext";
import { callWS } from "../../../../api/ws";
import { Modal } from "../../../../App";

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
    //console.log("deviceInfo: ", deviceInfo)
    const [sysInfo, setSysInfo] = useState("");
    useEffect(() => {
        let call = async () => {
            setSysInfo((await callWS("device-exec", {
                deviceUUID: deviceUUID,
                fromDevice: false,
                fromUUID: context.user.uuid,
                command: "top -bn1 | head -n2",
            })).data);
        };
        call();
        let i = setInterval(() => {
            call();
        }, 2000);
        return () => {
            clearInterval(i);
        }
    }, []);

    const [coreDumps, setCoreDumps] = useState([]);
    const [coreDumpsSize, setCoreDumpsSize] = useState("");
    const [coreDumpModalOpen, setCoreDumpModalOpen] = useState(false);
    const [coreDumpBackTraceContent, setCoreDumpBackTraceContent] = useState("");
    const [coreDumpCore, setCoreDumpCore] = useState({
        name: "",
        pid: "",
        time: "",
    });
    const updateCoreDumpList = useCallback(async () => {
        setCoreDumps((await callWS("device-exec", {
            deviceUUID: deviceUUID,
            fromDevice: false,
            fromUUID: context.user.uuid,
            command: "ls /tmp --full-time | grep -v / | tr ' ' ',' | tr '\n' '$'",
        })).data.split("$").map((c: string) => c.split(",").reverse()).filter((c: string[]) => c[0].startsWith("core.")).map((c: string[]) => ({
            name: c[0].split(".")[1],
            pid: c[0].split(".")[2],
            time: c[2] + " " + c[3],
        })));

        // find /tmp/ -type f -name 'core.*' -exec du -ch {} + | grep total
        setCoreDumpsSize((await callWS("device-exec", {
            deviceUUID: deviceUUID,
            fromDevice: false,
            fromUUID: context.user.uuid,
            command: "find /tmp/ -type f -name 'core.*' -exec du -ch {} + | grep total",
        })).data);
    }, []);
    useEffect(() => {
        updateCoreDumpList();
    }, []);
    //console.log("coreDumps: ", coreDumps);

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
                <div>
                    <pre>
                        {sysInfo}
                    </pre>
                </div>
            </p>
            <details>
                <summary>Actions</summary>
                <div className="grid">
                    <button className="secondary" onClick={async () => {
                        let res = (await callWS("device-exec", {
                            deviceUUID: deviceUUID,
                            fromDevice: false,
                            fromUUID: context.user.uuid,
                            command: "rc-service tinydm restart",
                        })).data
                        alert(res)
                    }}>
                        Restart Plasma Mobile
                    </button>
                    <button className="secondary" onClick={() => {
                        callWS("device-exec", {
                            deviceUUID: deviceUUID,
                            fromDevice: false,
                            fromUUID: context.user.uuid,
                            command: "reboot",
                        }, false)
                        alert("Ok")
                    }}>
                        Restart Device
                    </button>
                    <div></div>
                </div>
            </details>
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
                <div className="grid">
                    <button className="secondary" onClick={() => {
                        updateCoreDumpList();
                    }}>
                        Refresh
                    </button>
                    <button className="secondary" onClick={async () => {
                        await callWS("device-exec", {
                            deviceUUID: deviceUUID,
                            fromDevice: false,
                            fromUUID: context.user.uuid,
                            command: "rm /tmp/core.*",
                        }, false)
                        updateCoreDumpList();
                    }}>
                        Delete All Coredumps
                    </button>
                    <button className="secondary" onClick={() => {
                        if(coreDumpBackTraceContent !== "") {
                            setCoreDumpModalOpen(true);
                        } else {
                            alert("No backtrace currently loaded.");
                        }
                    }}>
                        Reopen Last Backtrace
                    </button>
                </div>
                <div>{coreDumpsSize}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Process</th>
                            <th>PID</th>
                            <th>Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coreDumps.map((core: any) => (
                            <tr>
                                <td>{core.name}</td>
                                <td>{core.pid}</td>
                                <td>{core.time}</td>
                                <td>
                                    <button className="primary" onClick={async () => {
                                        // gdb /usr/bin/plasmashell core.plasmashell.2954 -ex 'bt' -ex 'set pagination 0' -batch
                                        // get the binary first using which
                                        let bin = (await callWS("device-exec", {
                                            deviceUUID: deviceUUID,
                                            fromDevice: false,
                                            fromUUID: context.user.uuid,
                                            command: `which ${core.name}`,
                                        })).data.trim();
                                        console.log(bin);
                                        console.log(`gdb ${bin} /tmp/core.${core.name}.${core.pid} -ex 'bt' -ex 'set pagination 0' -batch`)
                                        setCoreDumpBackTraceContent("");
                                        setCoreDumpCore(core);
                                        setCoreDumpModalOpen(true);
                                        let res = (await callWS("device-exec", {
                                            deviceUUID: deviceUUID,
                                            fromDevice: false,
                                            fromUUID: context.user.uuid,
                                            command: `gdb ${bin} /tmp/core.${core.name}.${core.pid} -ex 'bt' -ex 'set pagination 0' -batch`,
                                        })).data
                                        console.log(res);
                                        setCoreDumpModalOpen(true);
                                        setCoreDumpBackTraceContent(res);
                                    }}>
                                        Load Backtrace
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
            <Modal title="Backtrace Viewer" isOpen={coreDumpModalOpen} onClose={() => setCoreDumpModalOpen(false)}>
                <div style={{minWidth: "50vw"}}></div>
                {coreDumpBackTraceContent === "" ? <div>
                    <p><center>Loading the backtrace for <code>core.{coreDumpCore.name}.{coreDumpCore.pid}</code> <br />(this may take a few minutes)</center><br /></p>
                    <progress></progress>
                </div> : <div>
                    <b>core.{coreDumpCore.name}.{coreDumpCore.pid}</b>
                    <pre style={{height: "50vh"}}>{coreDumpBackTraceContent}</pre>
                    <button className="primary" onClick={() => {
                        const element = document.createElement("a");
                        const file = new Blob([coreDumpBackTraceContent], {type: 'text/plain'});
                        element.href = URL.createObjectURL(file);
                        element.download = `core.${coreDumpCore.name}.${coreDumpCore.pid}.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                    }}>
                        Save as text file
                    </button>
                </div>}
                
            </Modal>
        </div>
    );
}