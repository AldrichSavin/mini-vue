import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

const mutableGet = createGetter();
const readonlyGet = createGetter(true);
const mutableSet = createSetter();

export const mutableHandlers = {
    get: mutableGet,
    set: mutableSet
}
export const readonlyHandlers = {
    get: readonlyGet,
    set(target, property, value) {
        console.warn(`Cannot set readonly property "${property}"!`);
        return true;
    }
}

function createGetter(isReadonly: boolean = false) {
    return function get(target, property) {
        // isReactive Check
        if (property === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        // isReadonly Check
        if (property === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }

        const value = Reflect.get(target, property);
        if (isObject(value)) {
            return isReadonly ? readonly(value) : reactive(value)
        }
        // normal logical get
        if (!isReadonly) {
            track(target, property);
        }
        return value;
    }
}

function createSetter() {
    return function set(target, property, value) {
        const nextValue = Reflect.set(target, property, value);
        trigger(target, property);
        return nextValue
    }
}
