import { Entity } from "./core/entity/entity";
import { App } from "./core/app/app";

export class Scene<T extends App> extends Entity<T> {}
