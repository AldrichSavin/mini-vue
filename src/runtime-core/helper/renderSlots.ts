import { hasOwnProperty, isFunction, isStructObject } from "../../shared/index";
import { createVNode } from "../createVNode";
import { Fragment } from "../../shared/SpecificBuiltinTags"

export function renderSlots(slots, renderName, props = {}) {
    if (hasOwnProperty(slots, renderName)) {
        if (isFunction(slots[renderName])) {
            const realSlot = slots[renderName]?.(props);
            return createVNode(Fragment, null, realSlot);
        }

        // NOTE: 这是自己增加到扩展，我需要支持slot无参数的情况
        if (isStructObject(slots[renderName])) {
            return createVNode(Fragment, null, slots[renderName]);
        }
    }
}