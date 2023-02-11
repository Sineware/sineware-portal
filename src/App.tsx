import React from "react";

import {
    createBrowserRouter,
    RouterProvider,
    Route,
  } from "react-router-dom";

import {AppContext} from "./state/AppContext";
import { LoginScreen } from "./screens/LoginScreen";
import {ErrorScreen} from "./screens/ErrorScreen";
import {DashboardScreen} from "./screens/dashboard/DashboardScreen";
import { DashboardOrgHome } from "./screens/dashboard/children/OrgHome";
import { ProLinuxHome } from "./screens/dashboard/children/prolinux/ProLinuxHome";

interface ModalProps {
    children: React.ReactNode;
    isOpen: boolean;
    title: string | React.ReactNode;
    disableClose?: boolean;
    onClose: () => void;
}
const Modal = (props: ModalProps) => {
    return (
        <dialog open={props.isOpen}>
            <article>
                <header>
                    {props.disableClose? null : <a onClick={props.onClose} aria-label="Close" className="close"></a>}
                    {props.title}
                </header>
                <div>
                    {props.children}
                </div>
            </article>
        </dialog>
    );
};

const router = createBrowserRouter([
    {
      path: "/",
      element: <LoginScreen />,
      errorElement: <ErrorScreen />,
    },
    {
        path: "dashboard",
        element: <DashboardScreen />,
        errorElement: <ErrorScreen />,
        children: [
            {
                path: "",
                element: <div style={{height: "25vh", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    <p>Select or create an organization.</p>
                </div>,
                errorElement: <ErrorScreen />,
            },
            {
                path: ":orgUUID",
                element: <DashboardOrgHome />,
                errorElement: <ErrorScreen />,
            },
            {
                path: ":orgUUID/prolinux/:deviceUUID",
                element: <ProLinuxHome />,
                errorElement: <ErrorScreen />,
            }
        ]
    }
  ]);

export function App() {
    const [isErrorModalOpen, setIsErrorModalOpen] = React.useState(false);
    const [error, setError] = React.useState({text: "", isFatal: false});
    const setErrorAndOpenModal = (text: string, isFatal: boolean = false) => {
        setError({text, isFatal});
        setIsErrorModalOpen(true);
    };

    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    const [user, setUser] = React.useState({});
    const [token, setToken] = React.useState("");

    return (
        <AppContext.Provider value={{isLoggedIn, setIsLoggedIn, user, setUser, token, setToken, setError: setErrorAndOpenModal}}>
            <Modal isOpen={isErrorModalOpen} title={error.isFatal ? 
                <div style={{color: "red"}}>
                    A Fatal Error Has Occurred! <br />
                    <small>The app has halted. Please restart and try again.</small>
                </div> : "An Error Has Occurred!"
            } disableClose={error.isFatal} onClose={() => setIsErrorModalOpen(false)}>
                <p>{error.text}</p>
            </Modal>
            <RouterProvider router={router} />
        </AppContext.Provider>
        
    );
}
