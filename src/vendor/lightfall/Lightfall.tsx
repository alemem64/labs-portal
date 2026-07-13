import { useEffect, useRef } from "react";
import { readTokenRgb } from "../../lib/tokens";

// reactbits.dev/backgrounds/lightfall에서 착안한 자체 WebGL 구현.
// Contract 04: 광선은 아래→위(상승). 외부 의존성 없음.

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;   // y=0 아래, y=1 위
  float cols = 26.0;
  float col = floor(uv.x * cols);
  float fx = fract(uv.x * cols) - 0.5;
  vec3 acc = vec3(0.0);

  for (int i = 0; i < 2; i++) {
    float seed = col * 13.37 + float(i) * 101.7;
    float speed = 0.05 + 0.11 * hash(seed + 1.0);
    float len = 0.18 + 0.25 * hash(seed + 2.0);
    // head가 시간에 따라 커짐 = 위로 상승
    float head = fract(uTime * speed + hash(seed + 3.0));
    float d = uv.y - head;
    float trail = smoothstep(-len, 0.0, d) * step(d, 0.0); // head 아래로 꼬리
    float tip = exp(-abs(d) * 90.0);
    float lateral = exp(-fx * fx * 30.0);
    float amp = 0.35 + 0.65 * hash(seed + 4.0);
    vec3 tone = mix(uColorA, uColorB, hash(seed + 5.0));
    acc += tone * (trail * 0.5 + tip) * lateral * amp;
  }

  float alpha = clamp(max(acc.r, max(acc.g, acc.b)), 0.0, 1.0);
  gl_FragColor = vec4(acc, alpha);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function Lightfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) return; // Contract 04: WebGL 불가 시 조용히 생략

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // fullscreen triangle
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const colorA: [number, number, number] = readTokenRgb("--lightfall-color-a") ?? [1, 0.3, 0.23];
    const colorB: [number, number, number] = readTokenRgb("--lightfall-color-b") ?? [0.28, 0.63, 1];
    gl.uniform3f(gl.getUniformLocation(program, "uColorA"), ...colorA);
    gl.uniform3f(gl.getUniformLocation(program, "uColorB"), ...colorB);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className="lightfall-canvas" aria-hidden="true" />;
}
