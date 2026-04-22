// Film grain + vignette ShaderPass for EffectComposer
export const GrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    time:     { value: 0.0 },
    amount:   { value: 0.07 },
  },

  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Animated grain
      float grain = rand(vUv + fract(time)) * amount;
      color.rgb = clamp(color.rgb + grain - amount * 0.5, 0.0, 1.0);

      // Vignette
      vec2 uv = vUv * 2.0 - 1.0;
      float vignette = 1.0 - dot(uv * 0.6, uv * 0.6);
      vignette = clamp(vignette, 0.0, 1.0);
      color.rgb *= vignette;

      gl_FragColor = color;
    }
  `,
};
