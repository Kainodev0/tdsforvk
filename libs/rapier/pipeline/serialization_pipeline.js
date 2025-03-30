import{RawSerializationPipeline}from"../raw";import{VectorOps}from"../math";import{World}from"./world";export class SerializationPipeline{free(){this.raw&&this.raw.free(),this.raw=void 0}constructor(r){this.raw=r||new RawSerializationPipeline}serializeAll(r,i,e,a,l,t,o,w,s){let n=VectorOps.intoRaw(r);const p=this.raw.serializeAll(n,i.raw,e.raw,a.raw,l.raw,t.raw,o.raw,w.raw,s.raw);return n.free(),p}deserializeAll(r){return World.fromRaw(this.raw.deserializeAll(r))}}