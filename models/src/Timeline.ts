import { Checkpoint } from "./Checkpoint";
import { Operation } from "./Operation";

export type Timeline = {
    name: string;
    operations: Array<Operation | Checkpoint>
}
