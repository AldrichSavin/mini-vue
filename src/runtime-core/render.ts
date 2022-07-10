import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment } from "../shared/SpecificBuiltinTags";
import { createComponentInstance, setupComponent } from "./component";
import { Text } from "../shared/SpecificBuiltinTags";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity";

export function createRenderer(customRenderOptions) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = customRenderOptions;

    function render(vnode, container, parentComponent) {
        patch(null, vnode, container, parentComponent);
    }

    // n1 --> oldSubtree
    // n2 --> newSubtree
    function patch(n1, n2, container, parentComponent) {
        switch (n2?.type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (n2.shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent);
                }
                if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }

    }

    function processElement(n1, n2: any, container: any, parentComponent) {
        if (!n1) { // n1 不存在->初始化
            mountElement(n2, container, parentComponent);
        } else {
            patchElement(n1, n2, container);
        }
    }
    // TODO: 实现Element的更新
    function patchElement(n1, n2, container) {
        console.log("patchElement", n1, n2, container);
    }

    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function processFragment(n1, n2: any, container: any, parentComponent) {
        mountChildren(n2?.children, container, parentComponent);
    }
    function mountComponent(initialVNode, container, parentComponent) {
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, container, initialVNode);
    }
    function mountElement(vnode: any, container: any, parentComponent) {
        const el = (vnode.el = hostCreateElement(vnode.type))
        if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = vnode.children;
        } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(vnode.children, el, parentComponent);
        }
        addAttrs(vnode, el);
        hostInsert(el, container);
    }
    function mountChildren(children = [], container, parentComponent) {
        children.forEach(child => {
            patch(null, child, container, parentComponent)
        })
    }

    function addAttrs(vnode, container) {
        const props = vnode.props || {};
        for (const key in props) {
            if (Object.prototype.hasOwnProperty.call(props, key)) {
                const value = props[key];
                hostPatchProp(container, key, value);
            }
        }
    }
    function processText(n1, n2: any, container: any) {
        const el = (n2.el = document.createTextNode(n2.children));
        container.append(el);
    }

    function setupRenderEffect(instance, container, initialVNode) {
        effect(() => {
            // initial
            if (!instance.isMounted) {
                // 当处于更新逻辑时， instance.subTree则为旧的数据（旧的VNode）
                const subTree = (instance.subTree = instance?.render.call(instance.proxy));
                patch(null, subTree, container, instance);
                initialVNode.el = subTree.el;
                instance.isMounted = true
            } else {
                // update
                // 在更新时候可以认为是新的VNod, 和初始化时候的VNode进行对比
                const subTree = instance?.render.call(instance.proxy);
                const prevSubTree = instance.subTree;

                // 设置为下一次对比的VNode
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        })
    }


    return {
        createApp: createAppAPI(render),
    }
}