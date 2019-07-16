import { expect } from "chai"

import app from '../src/app';

import * as helper from './mongoose-helper';

before(helper.before);
after(helper.after);

describe('App', () => {
  it('should exist', () => {
    expect(app).to.be.a('function');})
})

