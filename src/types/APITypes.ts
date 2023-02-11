/*
public struct User: Content {
    let uuid: String
    let email: String
    let username: String
    let fullname: String
    let passhash: String
    let accesstoken: String
    let lastip: String?
    let id: Int
    let phone: String?
    var organizations: [Organization]?
}
public struct Organization: Content {
    let id: Int
    let uuid: String
    let name: String
    let tier: String
}
*/
export interface APIUser {
    uuid: string;
    email: string;
    username: string;
    fullname: string;
    accesstoken: string;
    lastip: string | null;
    id: number;
    phone: string | null;
    organizations: APIOrganization[] | null;
}
export interface APIOrganization {
    id: number;
    uuid: string;
    name: string;
    tier: string;
}