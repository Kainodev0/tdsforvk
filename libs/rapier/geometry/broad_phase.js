import{RawBroadPhase}from"../raw";export class BroadPhase{free(){this.raw&&this.raw.free(),this.raw=void 0}constructor(r){this.raw=r||new RawBroadPhase}}