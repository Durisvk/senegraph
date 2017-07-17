import { expect } from 'chai';

import * as common from '../lib/common';


describe('Common applyToDefaultsWithoutCopy', () => {
  it('common should apply to defaults without copy simple objects', () => {
    expect(common.applyToDefaultsWithoutCopy({ id: 1 }, { some: 'data' }))
    .to.deep.equal({ id: 1, some: 'data' });
  });
  it('common should apply to defaults without copy more advanced objects', () => {
    expect(common.applyToDefaultsWithoutCopy({ id: 1, qwerty: '232', a: { b: 'c' } }, { some: 'data', c: { d: 'e' } }))
    .to.deep.equal({ id: 1, qwerty: '232', a: { b: 'c' }, some: 'data', c: { d: 'e' } });
  });
  it('common should use the default over options (should not override defaults)', () => {
    expect(common.applyToDefaultsWithoutCopy({ id: 1 }, { some: 'data', id: 2 }))
    .to.deep.equal({ id: 1, some: 'data' });
  });
});
