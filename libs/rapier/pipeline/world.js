import{BroadPhase,ColliderSet,NarrowPhase}from"../geometry";import{CCDSolver,IntegrationParameters,IslandManager,ImpulseJointSet,MultibodyJointSet,RigidBodySet}from"../dynamics";import{VectorOps}from"../math";import{PhysicsPipeline}from"./physics_pipeline";import{QueryPipeline}from"./query_pipeline";import{SerializationPipeline}from"./serialization_pipeline";import{DebugRenderBuffers,DebugRenderPipeline}from"./debug_render_pipeline";import{KinematicCharacterController,PidController}from"../control";import{DynamicRayCastVehicleController}from"../control";export class World{free(){this.integrationParameters.free(),this.islands.free(),this.broadPhase.free(),this.narrowPhase.free(),this.bodies.free(),this.colliders.free(),this.impulseJoints.free(),this.multibodyJoints.free(),this.ccdSolver.free(),this.queryPipeline.free(),this.physicsPipeline.free(),this.serializationPipeline.free(),this.debugRenderPipeline.free(),this.characterControllers.forEach((e=>e.free())),this.pidControllers.forEach((e=>e.free())),this.vehicleControllers.forEach((e=>e.free())),this.integrationParameters=void 0,this.islands=void 0,this.broadPhase=void 0,this.narrowPhase=void 0,this.bodies=void 0,this.colliders=void 0,this.ccdSolver=void 0,this.impulseJoints=void 0,this.multibodyJoints=void 0,this.queryPipeline=void 0,this.physicsPipeline=void 0,this.serializationPipeline=void 0,this.debugRenderPipeline=void 0,this.characterControllers=void 0,this.pidControllers=void 0,this.vehicleControllers=void 0}constructor(e,i,t,s,r,o,l,n,a,h,d,c,u,p){this.gravity=e,this.integrationParameters=new IntegrationParameters(i),this.islands=new IslandManager(t),this.broadPhase=new BroadPhase(s),this.narrowPhase=new NarrowPhase(r),this.bodies=new RigidBodySet(o),this.colliders=new ColliderSet(l),this.impulseJoints=new ImpulseJointSet(n),this.multibodyJoints=new MultibodyJointSet(a),this.ccdSolver=new CCDSolver(h),this.queryPipeline=new QueryPipeline(d),this.physicsPipeline=new PhysicsPipeline(c),this.serializationPipeline=new SerializationPipeline(u),this.debugRenderPipeline=new DebugRenderPipeline(p),this.characterControllers=new Set,this.pidControllers=new Set,this.vehicleControllers=new Set,this.impulseJoints.finalizeDeserialization(this.bodies),this.bodies.finalizeDeserialization(this.colliders),this.colliders.finalizeDeserialization(this.bodies)}static fromRaw(e){return e?new World(VectorOps.fromRaw(e.takeGravity()),e.takeIntegrationParameters(),e.takeIslandManager(),e.takeBroadPhase(),e.takeNarrowPhase(),e.takeBodies(),e.takeColliders(),e.takeImpulseJoints(),e.takeMultibodyJoints()):null}takeSnapshot(){return this.serializationPipeline.serializeAll(this.gravity,this.integrationParameters,this.islands,this.broadPhase,this.narrowPhase,this.bodies,this.colliders,this.impulseJoints,this.multibodyJoints)}static restoreSnapshot(e){return(new SerializationPipeline).deserializeAll(e)}debugRender(){return this.debugRenderPipeline.render(this.bodies,this.colliders,this.impulseJoints,this.multibodyJoints,this.narrowPhase),new DebugRenderBuffers(this.debugRenderPipeline.vertices,this.debugRenderPipeline.colors)}step(e,i){this.physicsPipeline.step(this.gravity,this.integrationParameters,this.islands,this.broadPhase,this.narrowPhase,this.bodies,this.colliders,this.impulseJoints,this.multibodyJoints,this.ccdSolver,e,i),this.queryPipeline.update(this.colliders)}propagateModifiedBodyPositionsToColliders(){this.bodies.raw.propagateModifiedBodyPositionsToColliders(this.colliders.raw)}updateSceneQueries(){this.propagateModifiedBodyPositionsToColliders(),this.queryPipeline.update(this.colliders)}get timestep(){return this.integrationParameters.dt}set timestep(e){this.integrationParameters.dt=e}get lengthUnit(){return this.integrationParameters.lengthUnit}set lengthUnit(e){this.integrationParameters.lengthUnit=e}get numSolverIterations(){return this.integrationParameters.numSolverIterations}set numSolverIterations(e){this.integrationParameters.numSolverIterations=e}get numAdditionalFrictionIterations(){return this.integrationParameters.numAdditionalFrictionIterations}set numAdditionalFrictionIterations(e){this.integrationParameters.numAdditionalFrictionIterations=e}get numInternalPgsIterations(){return this.integrationParameters.numInternalPgsIterations}set numInternalPgsIterations(e){this.integrationParameters.numInternalPgsIterations=e}switchToStandardPgsSolver(){this.integrationParameters.switchToStandardPgsSolver()}switchToSmallStepsPgsSolver(){this.integrationParameters.switchToSmallStepsPgsSolver()}switchToSmallStepsPgsSolverWithoutWarmstart(){this.integrationParameters.switchToSmallStepsPgsSolverWithoutWarmstart()}createRigidBody(e){return this.bodies.createRigidBody(this.colliders,e)}createCharacterController(e){let i=new KinematicCharacterController(e,this.integrationParameters,this.bodies,this.colliders,this.queryPipeline);return this.characterControllers.add(i),i}removeCharacterController(e){this.characterControllers.delete(e),e.free()}createPidController(e,i,t,s){let r=new PidController(this.integrationParameters,this.bodies,e,i,t,s);return this.pidControllers.add(r),r}removePidController(e){this.pidControllers.delete(e),e.free()}createVehicleController(e){let i=new DynamicRayCastVehicleController(e,this.bodies,this.colliders,this.queryPipeline);return this.vehicleControllers.add(i),i}removeVehicleController(e){this.vehicleControllers.delete(e),e.free()}createCollider(e,i){let t=i?i.handle:void 0;return this.colliders.createCollider(this.bodies,e,t)}createImpulseJoint(e,i,t,s){return this.impulseJoints.createJoint(this.bodies,e,i.handle,t.handle,s)}createMultibodyJoint(e,i,t,s){return this.multibodyJoints.createJoint(e,i.handle,t.handle,s)}getRigidBody(e){return this.bodies.get(e)}getCollider(e){return this.colliders.get(e)}getImpulseJoint(e){return this.impulseJoints.get(e)}getMultibodyJoint(e){return this.multibodyJoints.get(e)}removeRigidBody(e){this.bodies&&this.bodies.remove(e.handle,this.islands,this.colliders,this.impulseJoints,this.multibodyJoints)}removeCollider(e,i){this.colliders&&this.colliders.remove(e.handle,this.islands,this.bodies,i)}removeImpulseJoint(e,i){this.impulseJoints&&this.impulseJoints.remove(e.handle,i)}removeMultibodyJoint(e,i){this.impulseJoints&&this.multibodyJoints.remove(e.handle,i)}forEachCollider(e){this.colliders.forEach(e)}forEachRigidBody(e){this.bodies.forEach(e)}forEachActiveRigidBody(e){this.bodies.forEachActiveRigidBody(this.islands,e)}castRay(e,i,t,s,r,o,l,n){return this.queryPipeline.castRay(this.bodies,this.colliders,e,i,t,s,r,o?o.handle:null,l?l.handle:null,this.colliders.castClosure(n))}castRayAndGetNormal(e,i,t,s,r,o,l,n){return this.queryPipeline.castRayAndGetNormal(this.bodies,this.colliders,e,i,t,s,r,o?o.handle:null,l?l.handle:null,this.colliders.castClosure(n))}intersectionsWithRay(e,i,t,s,r,o,l,n,a){this.queryPipeline.intersectionsWithRay(this.bodies,this.colliders,e,i,t,s,r,o,l?l.handle:null,n?n.handle:null,this.colliders.castClosure(a))}intersectionWithShape(e,i,t,s,r,o,l,n){let a=this.queryPipeline.intersectionWithShape(this.bodies,this.colliders,e,i,t,s,r,o?o.handle:null,l?l.handle:null,this.colliders.castClosure(n));return null!=a?this.colliders.get(a):null}projectPoint(e,i,t,s,r,o,l){return this.queryPipeline.projectPoint(this.bodies,this.colliders,e,i,t,s,r?r.handle:null,o?o.handle:null,this.colliders.castClosure(l))}projectPointAndGetFeature(e,i,t,s,r,o){return this.queryPipeline.projectPointAndGetFeature(this.bodies,this.colliders,e,i,t,s?s.handle:null,r?r.handle:null,this.colliders.castClosure(o))}intersectionsWithPoint(e,i,t,s,r,o,l){this.queryPipeline.intersectionsWithPoint(this.bodies,this.colliders,e,this.colliders.castClosure(i),t,s,r?r.handle:null,o?o.handle:null,this.colliders.castClosure(l))}castShape(e,i,t,s,r,o,l,n,a,h,d,c){return this.queryPipeline.castShape(this.bodies,this.colliders,e,i,t,s,r,o,l,n,a,h?h.handle:null,d?d.handle:null,this.colliders.castClosure(c))}intersectionsWithShape(e,i,t,s,r,o,l,n,a){this.queryPipeline.intersectionsWithShape(this.bodies,this.colliders,e,i,t,this.colliders.castClosure(s),r,o,l?l.handle:null,n?n.handle:null,this.colliders.castClosure(a))}collidersWithAabbIntersectingAabb(e,i,t){this.queryPipeline.collidersWithAabbIntersectingAabb(e,i,this.colliders.castClosure(t))}contactPairsWith(e,i){this.narrowPhase.contactPairsWith(e.handle,this.colliders.castClosure(i))}intersectionPairsWith(e,i){this.narrowPhase.intersectionPairsWith(e.handle,this.colliders.castClosure(i))}contactPair(e,i,t){this.narrowPhase.contactPair(e.handle,i.handle,t)}intersectionPair(e,i){return this.narrowPhase.intersectionPair(e.handle,i.handle)}}