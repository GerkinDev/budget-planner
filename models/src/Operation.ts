export type Operation = Operation.OneTime | Operation.Recurring;
export namespace Operation {
    export enum EOperationType {
        OneTime = 'OneTime',
        Recurring ='Recurring',
    }

    type Base = {
        date: Date;
        amount: number;
        label: string;
        type: EOperationType
    }

    export type OneTime = Base & {
        type: EOperationType.OneTime,
    }
    export type Recurring = Base & {
        type: EOperationType.Recurring,
        periodicity: Recurring.Periodicity
    }
    export namespace Recurring {
        export type Periodicity = {
            interval: "day" | "week" | "month" | "year"
            every: number
        }
    }
}
