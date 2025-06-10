import * as THREE from 'three'

class SceneManager {
  constructor() {
    this.scene = null
this.renderer = null
    this.camera = null
    this.lights = {}
    this.ambientLight = null
    this.directionalLight = null
    this.isInitialized = false
    this.resizeObserver = null
    this.canvas = null
  }

init(canvas, width = 800, height = 600) {
    try {
      this.canvas = canvas
      
      // Initialize scene
      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color(0x87CEEB) // Sky blue background

      // Initialize renderer
      this.renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: true,
        alpha: true 
      })
      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      this.renderer.shadowMap.enabled = true
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

      // Initialize camera
      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      this.camera.position.set(15, 10, 15)
      this.camera.lookAt(0, 0, 0)

      // Setup lighting
      this.setupLighting()

      // Add basic ground plane
// Add basic ground plane
      this.addGroundPlane()

      // Setup canvas resize observer
      this.setupResizeObserver()

      this.isInitialized = true
      console.log('3D Scene initialized successfully')
      
      return true
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error)
return false
    }
  }

  setupLighting() {
    // Ambient light for overall illumination
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    this.scene.add(this.ambientLight)

    // Directional light for shadows and main illumination
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.directionalLight.position.set(10, 10, 5)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.camera.near = 0.1
    this.directionalLight.shadow.camera.far = 50
    this.directionalLight.shadow.camera.left = -20
    this.directionalLight.shadow.camera.right = 20
    this.directionalLight.shadow.camera.top = 20
    this.directionalLight.shadow.camera.bottom = -20
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.scene.add(this.directionalLight)

    // Add point light for additional illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.3, 30)
    pointLight.position.set(0, 8, 0)
    this.scene.add(pointLight)
  }

  addGroundPlane() {
    const groundGeometry = new THREE.PlaneGeometry(40, 40)
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x4ADE80,
      transparent: true,
      opacity: 0.8 
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.scene.add(ground)
  }

  addBlock(x, y, z, color = 0x4ADE80, size = 1) {
    const geometry = new THREE.BoxGeometry(size, size, size)
    const material = new THREE.MeshLambertMaterial({ color })
    const cube = new THREE.Mesh(geometry, material)
    
    cube.position.set(x, y + size/2, z)
    cube.castShadow = true
    cube.receiveShadow = true
    cube.userData = { x, y, z, blockType: 'block' }
    
    this.scene.add(cube)
    return cube
  }

  removeBlock(mesh) {
    if (mesh && mesh.parent) {
      mesh.parent.remove(mesh)
      // Clean up geometry and materials
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose())
        } else {
          mesh.material.dispose()
        }
      }
    }
  }

  updateLighting(quality) {
    if (!this.isInitialized) return

    switch (quality) {
      case 'low':
        this.ambientLight.intensity = 0.6
        this.directionalLight.intensity = 0.4
        this.renderer.shadowMap.enabled = false
        break
      case 'medium':
        this.ambientLight.intensity = 0.4
        this.directionalLight.intensity = 0.6
        this.renderer.shadowMap.enabled = true
        this.directionalLight.shadow.mapSize.setScalar(1024)
        break
      case 'high':
        this.ambientLight.intensity = 0.4
        this.directionalLight.intensity = 0.8
        this.renderer.shadowMap.enabled = true
        this.directionalLight.shadow.mapSize.setScalar(2048)
        break
      case 'ultra':
        this.ambientLight.intensity = 0.3
        this.directionalLight.intensity = 1.0
        this.renderer.shadowMap.enabled = true
        this.directionalLight.shadow.mapSize.setScalar(4096)
        break
    }
}

  render() {
    if (this.isInitialized && this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera)
    }
  }
  
  // Enhanced object selection support
  addSelectionBox(object) {
    if (!object) return null
    
    const box = new THREE.BoxHelper(object, 0x4F46E5)
    box.userData = { isSelectionBox: true, parentObject: object }
    this.scene.add(box)
    return box
  }
  
  removeSelectionBox(object) {
    const selectionBox = this.scene.children.find(child => 
      child.userData.isSelectionBox && child.userData.parentObject === object
    )
    if (selectionBox) {
      this.scene.remove(selectionBox)
      selectionBox.dispose()
    }
  }
  
  highlightObject(object, color = 0x4F46E5, intensity = 0.3) {
    if (object && object.material) {
      object.material.emissive = new THREE.Color(color)
      object.material.emissiveIntensity = intensity
      object.material.needsUpdate = true
    }
  }
  
  clearHighlight(object) {
    if (object && object.material) {
      object.material.emissive = new THREE.Color(0x000000)
      object.material.emissiveIntensity = 0
      object.material.needsUpdate = true
}
  }

  setupResizeObserver() {
    if (!this.canvas || !window.ResizeObserver) {
      console.warn('ResizeObserver not supported, canvas auto-resize disabled')
      return
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        this.resize(width, height)
      }
    })

    this.resizeObserver.observe(this.canvas.parentElement || this.canvas)
  }

  resize(width, height) {
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}
  }

  dispose() {
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.renderer) {
      this.renderer.dispose()
    }
    
    // Clean up scene objects
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }
    
    this.canvas = null
    this.isInitialized = false
  }

  getBlockAt(x, y, z) {
    return this.scene.children.find(child => 
      child.userData.x === x && 
      child.userData.y === y && 
      child.userData.z === z &&
      child.userData.blockType === 'block'
    )
  }

  getAllBlocks() {
    return this.scene.children.filter(child => 
      child.userData.blockType === 'block'
    )
  }
}

export default SceneManager