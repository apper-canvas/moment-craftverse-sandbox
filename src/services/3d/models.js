import * as THREE from 'three'

class ModelManager {
  constructor() {
    this.models = new Map()
    this.geometries = new Map()
    this.materials = new Map()
    this.loadedAssets = new Set()
    this.loadingPromises = new Map()
  }

  init() {
    // Initialize basic geometries
    this.createBasicGeometries()
    this.createBasicMaterials()
    console.log('Model Manager initialized')
  }

  createBasicGeometries() {
    // Basic cube geometry for blocks
    this.geometries.set('cube', new THREE.BoxGeometry(1, 1, 1))
    
    // Sphere geometry for decorative objects
    this.geometries.set('sphere', new THREE.SphereGeometry(0.5, 16, 16))
    
    // Cylinder geometry for tree trunks, pillars
    this.geometries.set('cylinder', new THREE.CylinderGeometry(0.3, 0.3, 2, 8))
    
    // Plane geometry for ground, water surfaces
    this.geometries.set('plane', new THREE.PlaneGeometry(1, 1))
    
    // Cone geometry for tree tops, decorations
    this.geometries.set('cone', new THREE.ConeGeometry(0.5, 1, 8))
  }

  createBasicMaterials() {
    // Block materials with different properties
    this.materials.set('grass', new THREE.MeshLambertMaterial({ 
      color: 0x4ADE80,
      transparent: false
    }))
    
    this.materials.set('dirt', new THREE.MeshLambertMaterial({ 
      color: 0x92400E,
      transparent: false
    }))
    
    this.materials.set('stone', new THREE.MeshLambertMaterial({ 
      color: 0x6B7280,
      transparent: false
    }))
    
    this.materials.set('wood', new THREE.MeshLambertMaterial({ 
      color: 0xA16207,
      transparent: false
    }))
    
    this.materials.set('water', new THREE.MeshLambertMaterial({ 
      color: 0x3B82F6,
      transparent: true,
      opacity: 0.7
    }))
    
    this.materials.set('sand', new THREE.MeshLambertMaterial({ 
      color: 0xF59E0B,
      transparent: false
    }))

    // Special materials
    this.materials.set('wireframe', new THREE.MeshBasicMaterial({ 
      wireframe: true,
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    }))

    this.materials.set('glass', new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      roughness: 0,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0
    }))
  }

  createBlock(type = 'grass', position = { x: 0, y: 0, z: 0 }, scale = 1) {
    const geometry = this.geometries.get('cube')
    const material = this.materials.get(type) || this.materials.get('grass')
    
    if (!geometry || !material) {
      console.error(`Failed to create block: geometry or material not found for type ${type}`)
      return null
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(position.x, position.y, position.z)
    mesh.scale.setScalar(scale)
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    // Add metadata
    mesh.userData = {
      type: 'block',
      blockType: type,
      position: { ...position },
      scale: scale,
      id: `block_${position.x}_${position.y}_${position.z}`
    }
    
    return mesh
  }

  createTree(position = { x: 0, y: 0, z: 0 }) {
    const group = new THREE.Group()
    
    // Tree trunk
    const trunkGeometry = this.geometries.get('cylinder')
    const trunkMaterial = this.materials.get('wood')
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.set(0, 1, 0)
    trunk.castShadow = true
    trunk.receiveShadow = true
    group.add(trunk)
    
    // Tree leaves
    const leavesGeometry = this.geometries.get('sphere')
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 })
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial)
    leaves.position.set(0, 2.5, 0)
    leaves.scale.setScalar(1.5)
    leaves.castShadow = true
    leaves.receiveShadow = true
    group.add(leaves)
    
    group.position.set(position.x, position.y, position.z)
    group.userData = {
      type: 'tree',
      position: { ...position },
      id: `tree_${position.x}_${position.y}_${position.z}`
    }
    
    return group
  }

  createWater(position = { x: 0, y: 0, z: 0 }, size = { width: 4, depth: 4 }) {
    const geometry = new THREE.PlaneGeometry(size.width, size.depth)
    const material = new THREE.MeshLambertMaterial({
      color: 0x006994,
      transparent: true,
      opacity: 0.6
    })
    
    const water = new THREE.Mesh(geometry, material)
    water.rotation.x = -Math.PI / 2
    water.position.set(position.x, position.y, position.z)
    water.receiveShadow = true
    
    water.userData = {
      type: 'water',
      position: { ...position },
      size: { ...size },
      id: `water_${position.x}_${position.y}_${position.z}`
    }
    
    return water
  }

  createPlaceholderModel(type = 'cube', position = { x: 0, y: 0, z: 0 }) {
    const models = {
      cube: () => this.createBlock('grass', position),
      tree: () => this.createTree(position),
      water: () => this.createWater(position),
      house: () => this.createSimpleHouse(position),
      tower: () => this.createTower(position)
    }
    
    const createFunction = models[type] || models.cube
    return createFunction()
  }

  createSimpleHouse(position = { x: 0, y: 0, z: 0 }) {
    const group = new THREE.Group()
    
    // House base
    const baseGeometry = this.geometries.get('cube')
    const baseMaterial = this.materials.get('stone')
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.scale.set(3, 2, 3)
    base.position.set(0, 1, 0)
    base.castShadow = true
    base.receiveShadow = true
    group.add(base)
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(2.5, 1.5, 4)
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.set(0, 3, 0)
    roof.rotation.y = Math.PI / 4
    roof.castShadow = true
    group.add(roof)
    
    group.position.set(position.x, position.y, position.z)
    group.userData = {
      type: 'house',
      position: { ...position },
      id: `house_${position.x}_${position.y}_${position.z}`
    }
    
    return group
  }

  createTower(position = { x: 0, y: 0, z: 0 }) {
    const group = new THREE.Group()
    
    // Tower segments
    for (let i = 0; i < 5; i++) {
      const geometry = this.geometries.get('cylinder')
      const material = this.materials.get('stone')
      const segment = new THREE.Mesh(geometry, material)
      segment.position.set(0, i * 2, 0)
      segment.castShadow = true
      segment.receiveShadow = true
      group.add(segment)
    }
    
    group.position.set(position.x, position.y, position.z)
    group.userData = {
      type: 'tower',
      position: { ...position },
      id: `tower_${position.x}_${position.y}_${position.z}`
    }
    
    return group
  }

  updateMaterialProperties(materialName, properties) {
    const material = this.materials.get(materialName)
    if (material) {
      Object.assign(material, properties)
      material.needsUpdate = true
    }
  }

  getMaterial(name) {
    return this.materials.get(name)
  }

  getGeometry(name) {
    return this.geometries.get(name)
  }

  addCustomMaterial(name, material) {
    this.materials.set(name, material)
  }

  addCustomGeometry(name, geometry) {
    this.geometries.set(name, geometry)
  }

  dispose() {
    // Dispose all geometries
    this.geometries.forEach(geometry => {
      geometry.dispose()
    })
    this.geometries.clear()
    
    // Dispose all materials
    this.materials.forEach(material => {
      material.dispose()
    })
    this.materials.clear()
    
    // Clear models
    this.models.clear()
    this.loadedAssets.clear()
    this.loadingPromises.clear()
  }

  // Helper method to create instanced meshes for performance
  createInstancedBlocks(type, positions, count) {
    const geometry = this.geometries.get('cube')
    const material = this.materials.get(type) || this.materials.get('grass')
    
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count)
    instancedMesh.castShadow = true
    instancedMesh.receiveShadow = true
    
    const matrix = new THREE.Matrix4()
    positions.forEach((pos, index) => {
      matrix.setPosition(pos.x, pos.y, pos.z)
      instancedMesh.setMatrixAt(index, matrix)
    })
    
    instancedMesh.instanceMatrix.needsUpdate = true
    return instancedMesh
  }
}

export default ModelManager