import{RawCCDSolver}from"../raw";export class CCDSolver{free(){this.raw&&this.raw.free(),this.raw=void 0}constructor(r){this.raw=r||new RawCCDSolver}}