import { createContext } from "react";
import { APIUser } from "../types/APITypes";
export const AppContext = createContext({

    isLoggedIn: false,
    setIsLoggedIn: (isLoggedIn: boolean) => {},

    user: {} as APIUser,
    setUser: (user: APIUser) => { },

    token: "",
    setToken: (token: string) => { },

    setError: (text: string, isFatal?: boolean) => { },
});