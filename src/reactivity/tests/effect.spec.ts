import { effect } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
    it("should work with basic effect", () => {
        // reactive user object
        const user = reactive({ age: 19 });
        let nextAge;
        effect(() => {
            nextAge = user.age + 1;
        });
        expect(nextAge).toBe(20);

        // update user age
        user.age++;
        expect(nextAge).toBe(21);
    });

    it("effect should return a runner function, call allow get return value", () => {
        let foo = 10;
        const runner = effect(() => {
            foo += 1;
            return "bar";
        });
        expect(foo).toBe(11);

        const result = runner();
        expect(foo).toBe(12);
        expect(result).toBe("bar");
    })
});
