import { Form, Formik, Field, ErrorMessage } from "formik";
import React, { useContext, useEffect, useState } from "react";
import { Link, Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import Select from 'react-select'
import { useWS } from "../../api/Hooks";
import { callWS } from "../../api/ws";
import { AppContext } from "../../state/AppContext";
import { DashboardOrgHome } from "./children/OrgHome";

const usePing = () => {
    const [ping, setPing] = useWS<any>("ping");
    const [calculatedPing, setCalculatedPing] = useState<null | number>(null);
    useEffect(() => {
        setPing({text: new Date().getTime().toString()});
        let interval = setInterval(() => {
            setPing({text: new Date().getTime().toString()});
        }, 10000);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        if (ping) {
            setCalculatedPing(new Date().getTime() - parseInt(ping?.data));
        }
    }, [ping]);
    return calculatedPing;
}

export function DashboardScreen() {
    const context = useContext(AppContext);
    if(!context.isLoggedIn) {
        window.lastRoute = window.location.pathname;
        console.log("set lastRoute: ", window.lastRoute);
        return <Navigate to="/" />;
    }

    const [isLoading, setIsLoading] = useState(true);
    
    const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
    const [debugInfo] = useWS<any>("debug", {});
    //const [orgInfo, setOrgInfoPayload] = useWS<any>("get-org");
    const [selfInfo] = useWS<any>("get-self", {});
    const ping = usePing();
    const navigate = useNavigate();
    const { orgUUID } = useParams();
    
    // make sure debugInfo, and selfInfo are loaded
    useEffect(() => {
        if (selfInfo && debugInfo && ping) {
            setIsLoading(false);
        }
    }, [selfInfo, ping, debugInfo]);
    useEffect(() => {
        if (orgUUID) {
            callWS("update-selected-org", {
                orgUUID: orgUUID
            });
        }
    }, [orgUUID]);

    if (isLoading) {
        return <div>Loading...</div>;
    }
    
    return (
        <>
            <header>
            <nav>
                <ul>
                    <li><strong>Sineware Cloud Portal</strong></li>
                </ul>
                <ul>
                    <li><a href="#" className="contrast" onClick={() => {
                        navigate("/dashboard");
                    }}>Overview</a></li>
                    <li><a href="#" onClick={() => {
                        alert("Not implemented yet!")
                    }}>Settings</a></li>
                    <li><a href="#" onClick={() => {
                        alert("Not implemented yet!")
                    }}>About</a></li>
                    <li><a href="#" onClick={() => {
                        localStorage.clear();
                        location.reload();
                    }}>Logout</a></li>
                </ul>
            </nav>
            <div style={{display: "flex", flexDirection: "row", width: "100%"}}>
                <div>
                    <i className="fa-solid fa-user"></i> {context.user.username} 
                </div>
                <div style={{marginLeft: "auto"}}>
                    <p><span className="status-ok"></span> Connected to the Gateway ({ping ?? "-"} ms)</p>
                </div>
            </div>
            <div className="grid">
                <div><Select options={selfInfo?.data?.organizations?.map(o => ({value: o.uuid, label: o.name}))} isClearable onChange={
                    async (e: any) => {
                        console.log(e);
                        /*setOrgInfoPayload(e ? {
                            uuid: e?.value
                        } : null);*/
                        let res = await callWS("update-selected-org", {
                            orgUUID: e?.value
                        });
                        console.log("update-selected-org: ", res)
                        navigate(`/dashboard/${e?.value}`);
                    }
                } /></div>
                <div>
                    <div className="grid">
                        <button className="secondary" disabled={true} onClick={() => {
                            console.log("Settings")
                        }}>
                            Settings
                        </button>
                        <button className="" onClick={() => {
                            setCreateOrgModalOpen(true);
                        }}>
                            New
                        </button>
                    </div>
                </div>
            </div>
            <hr />
            </header>
            <main>
                {/*orgInfo ? <div>
                    <DashboardOrgHome uuid={orgInfo.data.uuid}/>
                </div> : <div style={{height: "25vh", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    <p>Select or create an organization.</p>
                    <Link to="fdsagdg">fewafe</Link>
                    </div>*/}
                <Outlet />
                <hr />
                <br />
                <details>
                    <summary>Debug Info</summary>
                    <p>{/*JSON.stringify(orgInfo?.data, null, 2)*/}</p>
                    <p>{JSON.stringify(debugInfo?.data, null, 2)}</p>
                </details>
                
            </main>

            {/* Create Org Modal */}
            <dialog open={createOrgModalOpen}>
                <article>
                    <header>
                    <a onClick={() => setCreateOrgModalOpen(false)} aria-label="Close" className="close"></a>
                        Create Organization
                    </header>
                    <Formik
                        initialValues={{ orgName: "" }}
                        onSubmit={async (values, { }) => {
                            try {
                                await callWS("create-org", {
                                    name: values.orgName,
                                    description: "",
                                    website: "",
                                    logo: ""
                                });
                                setCreateOrgModalOpen(false);
                            } catch (e) {
                                console.log(e);
                            }
                        }}
                    >
                        {({isSubmitting}) => (
                            <Form>
                                <label htmlFor="orgName">Organization Name</label>
                                <Field type="text" id="orgName" name="orgName" />
                                <ErrorMessage name="orgName" component="div" />

                                <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>Create</button>
                            </Form>
                        )}
                        
                    </Formik>
                </article>
            </dialog>
        </>
    );
}