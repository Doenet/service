process.env.NODE_ENV = 'test';

import { expect } from "chai"

import app from '../src/app';

describe('App', () => {
  it('should exist', () => {
    expect(app).to.be.a('function');})
})
