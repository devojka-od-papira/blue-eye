import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import eyeBallImg from './assets/eyeball.jpg'

console.clear()

const vertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
`

const fragmentShader = `
    varying vec2 vUv;

    uniform float u_shrink;
    uniform vec3 u_base_color_1;
    uniform vec3 u_base_color_2;
    uniform vec3 u_mid_color;
    uniform float u_vignette;
    uniform float u_brightness;
    uniform float u_darkness;

    float random (in vec2 st) {
        return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
    }
    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    float fbm (in vec2 st) {
        float value = 0.0;
        float amplitude = .5;
        float frequency = 0.;
        for (int i = 0; i < 4; i++) {
            value += amplitude * noise(st);
            st *= 2.;
            amplitude *= .5;
        }
        return value;
    }

    float length2( vec2 p ) {
        vec2 q = p*p*p*p;
        return pow( q.x + q.y, 1.0/4.0 );
    }

    void main() {
        vec2 st = vec2(.5) - vUv;
        st.x *= 6.28318531; // 2Pi
        st.y *= 3.14159265359; // Pi

        float r = length(st) * 1.3;
        float a = atan(st.y, st.x);

        float pulsing = 1. + clamp(1. - r, 0., 1.) * u_shrink;

        // noisy fullscreen mix of 2 colors
        float f = fbm(5. * st);
        vec3 col = mix(u_base_color_1, u_base_color_2, f);

        // blury spot in the middle
        col = mix(col, u_mid_color, 1. - smoothstep(0.2, 0.6, r * (.2 + .8 * pulsing)));

        // white streaks
        a += .05 * fbm(20. * st) * fbm(20. * st);
        f = smoothstep((1. - u_brightness), 1., fbm(vec2(20. * a, 6. * r * pulsing)));
        col = mix(col, vec3(1.), f);

        // dark insertions
        a = fbm(vec2(15. * a, 10. * r * pulsing));
        f = smoothstep(.4, .9,  a);
        col *= 1. - u_darkness * f;

        // vignette
        col *= 1. - u_vignette * smoothstep(.6, .8, r * (.9 + .1 * pulsing));

        // pupil
        f = 1. - smoothstep(.2, .25, r * pulsing);
        col = mix(col, vec3(.0), f);

        // clip the eye
        col = mix(col, vec3(1.), smoothstep(.79, 0.85, r));

        gl_FragColor = vec4(col, 1.);
    }

`

const Eye = () => {
  const canvasRef = useRef()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const eyeGroupRef = useRef()
  // Create eye ball texture
  const eyeBallTexture = new THREE.TextureLoader().load(eyeBallImg)
  useEffect(() => {
    // Create scene
    const scene = new THREE.Scene()
    const eyeRadius = 30

    // Light
    // Create Ambient Light
    const ambientLight = new THREE.AmbientLight(0x333333, 0.7)
    scene.add(ambientLight)

    // Create Direction Light
    const directionalLight = new THREE.DirectionalLight(0x555555, 1)
    scene.add(directionalLight)

    // Set up backgroud color white
    scene.background = new THREE.Color(0xffffff)

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    // Set up camera near scene
    camera.position.set(0, 0, 170)

    // Create render
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)

    // Create a eye group
    const eyeGroup = new THREE.Group()
    eyeGroupRef.current = eyeGroup
    eyeGroup.position.z = 0

    // Create eyeAddon (addon eye) and eyeShaderMaterial
    const eyeAddonGeometry = new THREE.SphereGeometry(eyeRadius, 32, 32)
    const eyeAddonMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x2200000,
      opacity: 0.4,
      shininess: 100,
      transparent: true,
      map: eyeBallTexture,
    })
    const eyeAddon = new THREE.Mesh(eyeAddonGeometry, eyeAddonMaterial)
    eyeGroup.add(eyeAddon)

    // Create eye (main eye) and eyeShaderMaterial
    const eyeGeometry = new THREE.SphereGeometry(eyeRadius - 0.1, 32, 32)
    const eyeShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_shrink: { type: 'f', value: 0 },
        u_base_color_1: { type: 'v3', value: new THREE.Color(0x30b6c0) },
        u_base_color_2: { type: 'v3', value: new THREE.Color(0x272e3a) },
        u_mid_color: { type: 'v3', value: new THREE.Color(0x4d411e) },
        u_vignette: { type: 'f', value: 0.65 },
        u_brightness: { type: 'f', value: 0.6 },
        u_darkness: { type: 'f', value: 0.5 },
      },
      vertexShader,
      fragmentShader,
    })
    const eye = new THREE.Mesh(eyeGeometry, eyeShaderMaterial)
    eye.rotation.y = -Math.PI / 2
    eyeGroup.add(eye)

    scene.add(eyeGroup)

    // Rotation eye
    // eyeGroup.rotation.set(0, Math.PI / 4, 0)
    eyeGroup.rotation.set(0, 2 * Math.PI, 0)

    // Event listener
    window.addEventListener('resize', () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    })

    window.addEventListener('mousemove', (event) => {
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1
      const mouseY = -((event.clientY / window.innerHeight) * 2 - 1)
      setMousePosition({ x: mouseX, y: mouseY })
    })

    const updateEyePosition = () => {
      // Update the eye's position based on the mouse cursor (this.mouse.y * 0.3 - this.eyeGroup.rotation.x) * .2
      eyeGroupRef.current.rotation.x =
        (mousePosition.x * 2 - eyeGroup.rotation.x) * 0.2
      eyeGroupRef.current.rotation.y =
        (mousePosition.y * 2 - eyeGroup.rotation.y) * 0.2
    }

    console.log('mousePosition', mousePosition)

    // Funkction for requestAnimationFrame
    const animate = () => {
      requestAnimationFrame(animate)

      updateEyePosition()

      renderer.render(scene, camera)
    }

    animate()
  }, [mousePosition])

  return <canvas ref={canvasRef} />
}

export default Eye
