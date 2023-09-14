export type Operation = Operation.OneTime | Operation.Recurring | Operation.Checkpoint;
export namespace Operation {
    type Base = {
        date: Date;
        amount: number;
        label: string;
        type: Type
    }
    export enum Type {
        OneTime = 'OneTime',
        Recurring ='Recurring',
        Checkpoint ='Checkpoint',
    }

    export type OneTime = Base & {
        type: Type.OneTime,
    }
    export type Recurring = Base & {
        type: Type.Recurring,
        periodicity: Recurring.Periodicity;
        until?: Date
    }
    export namespace Recurring {
        export type Periodicity = {
            interval: "day" | "week" | "month" | "year"
            every: number
        }
    }
    export type Checkpoint = Base & {
        type: Type.Checkpoint,
    }    
}
