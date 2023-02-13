import React, { Children, useContext, useEffect } from "react";
import {Formik, Form, Field, ErrorMessage} from "formik";
import { login } from "../api/auth";
import { connect } from "../api/ws";
import { AppContext } from "../state/AppContext";
import { useNavigate } from "react-router-dom";
import { APIUser } from "../types/APITypes";

export function LoginScreen() {
    let context = useContext(AppContext);
    let navigate = useNavigate();
    useEffect(() => {
        if(context.isLoggedIn) {
            console.log("lastRoute: ", window.lastRoute);
            if(window.lastRoute) {
                if(window.lastRoute.startsWith("/cloud")) {
                    window.lastRoute = window.lastRoute.substring(6);
                }
                navigate(window.lastRoute);
            } else {
                navigate("/dashboard");
            }
        }
    }, [context.isLoggedIn, navigate]);
    const [isLoading, setIsLoading] = React.useState(true);
    useEffect(() => {
        async function connectToWS() {
            if(localStorage.getItem("token")) {
                context.setToken(localStorage.getItem("token")!);
                try {
                    let user: APIUser = await connect(localStorage.getItem("token")!, context.setError);
                    context.setUser(user);
                    context.setIsLoggedIn(true);
                    console.log("Connected!");
                    return null;
                } catch(e) {
                    console.log(e);
                    localStorage.clear();
                    setTimeout(() => {
                        location.reload();
                    }, 2500)
                }
                return null;
            } else {
                setIsLoading(false);
            }
        }
        connectToWS();
    }, []);
    if(isLoading) {
        return <div>Logging In...</div>;
    }
    return (
        <>
            <header>
                <hgroup>
                    <h1>Sineware Cloud Portal</h1>
                    <h2>Sign in using your Sineware ID.</h2>
                </hgroup>
                <hr />
            </header>
            <main>
                <Formik
                    initialValues={{ username: "", password: "", totp: "" }}
                    onSubmit={async (values, {setSubmitting, setErrors}) => {
                        try {
                            console.log("Logging in... (button)");
                            let res: any = await login(values.username, values.password, values.totp);
                            console.log("Login response: ", res);
                            if (res.status) {
                                context.setToken(res.data);
                                localStorage.setItem('token', res.data);
                                let user: APIUser = await connect(res.data, context.setError);
                                context.setUser(user);
                                context.setIsLoggedIn(true);
                                console.log("Connected!");
                            } else {
                                context.setError(res.data);
                            }
                        } catch (e) {
                            console.error(e);
                            context.setError(e.message, true);
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <label>
                                Username
                                <Field type="text" name="username" />
                            </label>
                            <label>
                                Password
                                <Field type="password" name="password" />
                            </label>
                            
                            <ErrorMessage name="password" component="div" />
                            <div className="grid">
                                <div>
                                    <label>
                                        TOTP Authenticator Code (optional)
                                        <Field type="password" name="totp" />
                                    </label>
                                </div>
                                <div>
                                    <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} style={{height: "80%"}}>
                                        Log In
                                    </button>
                                </div>
                            </div>
                            
                        </Form>
                    )}
                </Formik>
                
            </main>
        </>
    );
}