import * as THREE from 'three'

class CameraController {
  constructor(camera, domElement) {
    this.camera = camera
    this.domElement = domElement
    this.target = new THREE.Vector3(0, 0, 0)
    
    // Camera state
    this.isOrbiting = false
    this.isPanning = false
    this.isZooming = false
    
    // Mouse state
    this.mouse = {
      current: new THREE.Vector2(),
      previous: new THREE.Vector2(),
      delta: new THREE.Vector2()
    }
    
    // Camera settings
    this.minDistance = 5
    this.maxDistance = 50
    this.distance = 20
    this.panSpeed = 2
    this.rotateSpeed = 1
    this.zoomSpeed = 0.1
    
    // Spherical coordinates for orbital movement
    this.spherical = new THREE.Spherical()
    this.spherical.setFromVector3(this.camera.position.clone().sub(this.target))
    
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Mouse events
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this))
    this.domElement.addEventListener('wheel', this.onWheel.bind(this))
    
    // Touch events for mobile
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this))
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this))
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this))
    
    // Keyboard events
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    
    // Prevent context menu
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  onMouseDown(event) {
    event.preventDefault()
    
    this.mouse.previous.set(event.clientX, event.clientY)
    
    if (event.button === 0) { // Left mouse button
      this.isOrbiting = true
    } else if (event.button === 1 || event.button === 2) { // Middle or right mouse button
      this.isPanning = true
    }
    
    this.domElement.style.cursor = this.isOrbiting ? 'grabbing' : 'move'
  }

  onMouseMove(event) {
    if (!this.isOrbiting && !this.isPanning) return
    
    this.mouse.current.set(event.clientX, event.clientY)
    this.mouse.delta.subVectors(this.mouse.current, this.mouse.previous)
    
    if (this.isOrbiting) {
      this.rotate(this.mouse.delta.x * 0.01, this.mouse.delta.y * 0.01)
    } else if (this.isPanning) {
      this.pan(this.mouse.delta.x * 0.01, this.mouse.delta.y * 0.01)
    }
    
    this.mouse.previous.copy(this.mouse.current)
    this.update()
  }

  onMouseUp(event) {
    this.isOrbiting = false
    this.isPanning = false
    this.domElement.style.cursor = 'grab'
  }

  onWheel(event) {
    event.preventDefault()
    
    const delta = event.deltaY > 0 ? 1 : -1
    this.zoom(delta * this.zoomSpeed)
    this.update()
  }

  onTouchStart(event) {
    if (event.touches.length === 1) {
      this.mouse.previous.set(event.touches[0].clientX, event.touches[0].clientY)
      this.isOrbiting = true
    }
  }

  onTouchMove(event) {
    if (event.touches.length === 1 && this.isOrbiting) {
      this.mouse.current.set(event.touches[0].clientX, event.touches[0].clientY)
      this.mouse.delta.subVectors(this.mouse.current, this.mouse.previous)
      
      this.rotate(this.mouse.delta.x * 0.01, this.mouse.delta.y * 0.01)
      this.mouse.previous.copy(this.mouse.current)
      this.update()
    }
  }

  onTouchEnd(event) {
    this.isOrbiting = false
  }

  onKeyDown(event) {
    const moveDistance = 2
    
    switch (event.key.toLowerCase()) {
      case 'w':
        this.moveForward(moveDistance)
        break
      case 's':
        this.moveBackward(moveDistance)
        break
      case 'a':
        this.moveLeft(moveDistance)
        break
      case 'd':
        this.moveRight(moveDistance)
        break
      case 'q':
        this.moveUp(moveDistance)
        break
      case 'e':
        this.moveDown(moveDistance)
        break
      case 'r':
        this.resetCamera()
        break
    }
  }

  rotate(deltaX, deltaY) {
    this.spherical.theta -= deltaX * this.rotateSpeed
    this.spherical.phi += deltaY * this.rotateSpeed
    
    // Limit vertical rotation
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi))
  }

  pan(deltaX, deltaY) {
    const offset = new THREE.Vector3()
    offset.copy(this.camera.position).sub(this.target)
    
    // Calculate the camera's right and up vectors
    const right = new THREE.Vector3()
    right.setFromMatrixColumn(this.camera.matrix, 0)
    
    const up = new THREE.Vector3()
    up.setFromMatrixColumn(this.camera.matrix, 1)
    
    // Apply panning
    const panDelta = new THREE.Vector3()
    panDelta.add(right.multiplyScalar(-deltaX * this.panSpeed))
    panDelta.add(up.multiplyScalar(deltaY * this.panSpeed))
    
    this.target.add(panDelta)
  }

  zoom(delta) {
    this.spherical.radius += delta * this.distance * 0.1
    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius))
    this.distance = this.spherical.radius
  }

  moveForward(distance) {
    const direction = new THREE.Vector3()
    this.camera.getWorldDirection(direction)
    this.target.add(direction.multiplyScalar(distance))
    this.update()
  }

  moveBackward(distance) {
    this.moveForward(-distance)
  }

  moveLeft(distance) {
    const right = new THREE.Vector3()
    right.setFromMatrixColumn(this.camera.matrix, 0)
    this.target.add(right.multiplyScalar(-distance))
    this.update()
  }

  moveRight(distance) {
    this.moveLeft(-distance)
  }

  moveUp(distance) {
    this.target.y += distance
    this.update()
  }

  moveDown(distance) {
    this.moveUp(-distance)
  }

  resetCamera() {
    this.target.set(0, 0, 0)
    this.spherical.set(20, Math.PI / 4, Math.PI / 4)
    this.update()
  }

  update() {
    // Update camera position based on spherical coordinates
    const position = new THREE.Vector3()
    position.setFromSpherical(this.spherical)
    position.add(this.target)
    
    this.camera.position.copy(position)
    this.camera.lookAt(this.target)
  }

  setTarget(x, y, z) {
    this.target.set(x, y, z)
    this.update()
  }

  getDistance() {
    return this.spherical.radius
  }

  dispose() {
    // Remove event listeners
    this.domElement.removeEventListener('mousedown', this.onMouseDown)
    this.domElement.removeEventListener('mousemove', this.onMouseMove)
    this.domElement.removeEventListener('mouseup', this.onMouseUp)
    this.domElement.removeEventListener('wheel', this.onWheel)
    this.domElement.removeEventListener('touchstart', this.onTouchStart)
    this.domElement.removeEventListener('touchmove', this.onTouchMove)
    this.domElement.removeEventListener('touchend', this.onTouchEnd)
    document.removeEventListener('keydown', this.onKeyDown)
  }
}

export default CameraController