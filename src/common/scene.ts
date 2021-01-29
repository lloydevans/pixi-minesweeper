import { Entity } from "./entity";
import { AppBase } from "./app-base";

export class Scene<T extends AppBase> extends Entity<T> {}
