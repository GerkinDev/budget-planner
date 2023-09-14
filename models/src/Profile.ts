import { Timeline } from "./Timeline"

export type ProfileV1 = {
    name: string;
    version: 1;
    timelines: Timeline[]
}

export type Profile = ProfileV1;
export namespace Profile {
    export type Current = Omit<ProfileV1, 'version'>
}
