import { extend } from "../shared";

let activeEffect: ReactiveEffect | null = null
class ReactiveEffect {
    deps: (Set<any>)[] = []
    active = true;
    onStop?: () => void
    constructor(private _fn: Function, public scheduler?) { }
    run() {
        activeEffect = this;
        return this._fn();
    }

    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}

function cleanupEffect(effect) {
    effect.deps.forEach((dep: Set<any>) => {
        dep.delete(effect);
    });
}

const targetMap = new Map;
// 依赖收集
export function track(target, property) {
    // 通过target找到property, 在通过property找到对应的deps
    // target -> property -> deps -> call dep fn;
    if (!targetMap.has(target)) {
        targetMap.set(target, new Map);
    }
    const propertyDepsMap = targetMap.get(target);

    if (!propertyDepsMap.has(property)) {
        propertyDepsMap.set(property, new Set);
    }
    const propertyDeps = propertyDepsMap.get(property);

    // activeEffect 只有在effect中的时候才会存在,当只是单纯的响应式对象取值的时候并不存在
    if (activeEffect) {
        propertyDeps.add(activeEffect);
        // 反向收集, 用于在activeEffect中使用deps
        activeEffect?.deps.push(propertyDeps);
    }
}

// 触发依赖
export function trigger(target, property) {
    const deps = targetMap.get(target).get(property);
    if (deps) {
        for (const effect of deps) {
            runReactiveEffect(effect);
        }
    }
}

function runReactiveEffect(effect: ReactiveEffect) {
    if (effect.scheduler) {
        effect.scheduler()
    } else {
        effect.run();
    }
}

interface EffectOptions {
    scheduler?: () => void;
    onStop?: () => void;
}

export function effect(fn, effectOptions?: EffectOptions) {
    const _effect = new ReactiveEffect(fn, effectOptions?.scheduler,);
    extend(_effect, effectOptions);

    _effect.run();
    const runner: any = _effect.run.bind(_effect);

    // Note: 挂在runner上的effect方法是为了让effect能够被stop
    runner.effect = _effect;

    return runner;
}

export function stop(runner) {
    // 调用ReactiveEffect的stop方法
    runner.effect.stop();
};