"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const common = require("../lib/common");
describe('Common applyToDefaultsWithoutCopy', () => {
    it('common should apply to defaults without copy simple objects', () => {
        chai_1.expect(common.applyToDefaultsWithoutCopy({ id: 1 }, { some: 'data' }))
            .to.deep.equal({ id: 1, some: 'data' });
    });
    it('common should apply to defaults without copy more advanced objects', () => {
        chai_1.expect(common.applyToDefaultsWithoutCopy({ id: 1, qwerty: '232', a: { b: 'c' } }, { some: 'data', c: { d: 'e' } }))
            .to.deep.equal({ id: 1, qwerty: '232', a: { b: 'c' }, some: 'data', c: { d: 'e' } });
    });
    it('common should use the default over options (should not override defaults)', () => {
        chai_1.expect(common.applyToDefaultsWithoutCopy({ id: 1 }, { some: 'data', id: 2 }))
            .to.deep.equal({ id: 1, some: 'data' });
    });
});
//# sourceMappingURL=commonTest.js.map