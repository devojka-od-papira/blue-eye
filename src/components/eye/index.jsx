import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

const Eye = () => {
  const canvasRef = useRef()
  useEffect(() => {
    // Create scene
    const scene = new THREE.Scene()

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 5

    // Create renderer
    // const renderer = new THREE.WebGLRenderer()
    // renderer.setSize(window.innerWidth, window.innerHeight)
    // document.body.appendChild(renderer.domElement)
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current })
    renderer.setSize(window.innerWidth, window.innerHeight)

    // Create geometry for white part of eye
    const whiteEyeGeometry = new THREE.SphereGeometry(1, 32, 32)
    const whiteEyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const whiteEye = new THREE.Mesh(whiteEyeGeometry, whiteEyeMaterial)
    scene.add(whiteEye)

    // Create geometry for color part of eye
    const pupilGeometry = new THREE.SphereGeometry(0.3, 32, 32)
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
    pupil.position.set(0, 0, 1)
    whiteEye.add(pupil)

    // Create light
    const light = new THREE.PointLight(0xffffff, 1)
    light.position.set(0, 0, 5)
    scene.add(light)

    // Event listener
    window.addEventListener('resize', () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    })

    // Funkction for requestAnimationFrame
    const animate = () => {
      requestAnimationFrame(animate)
      whiteEye.rotation.x += 0.01
      whiteEye.rotation.y += 0.01
      renderer.render(scene, camera)
    }

    animate()
  }, [])

  return <canvas ref={canvasRef} />
}

export default Eye
