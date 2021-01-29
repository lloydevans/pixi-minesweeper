import { Entity } from "./entity";
import { App } from "./app";

export class Scene<T extends App> extends Entity<T> {}
