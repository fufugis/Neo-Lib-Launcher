import React from 'react';
import { artworkRenderGeometry } from './lounge-artwork-render-model.mjs';

// Static GPU draw per image/size/control change; CSS animates the parent.
export default function LoungeArtworkPixels({ src, chromaticOffset, positionX = 50, positionY = 50, saturation = 1, contrast = 1, zoom = 1, fit = 'cover', onArtworkLoad, onError, safeFallback = false }) {
  const canvasRef = React.useRef(null);
  const controls = React.useRef({ chromaticOffset, positionX, positionY, fit });
  controls.current = { chromaticOffset, positionX, positionY, fit };
  const callbacks = React.useRef({ onArtworkLoad, onError }); callbacks.current = { onArtworkLoad, onError };
  const [contextEpoch, setContextEpoch] = React.useState(0);
  const redraw = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true });
    if (!gl) {
      const fallback = new Image(); fallback.crossOrigin = 'anonymous';
      fallback.onload = () => callbacks.current.onArtworkLoad?.(fallback);
      fallback.onerror = () => callbacks.current.onError?.(); fallback.src = src;
      return () => { fallback.onload = null; fallback.onerror = null; };
    }
    let disposed = false, contextInvalid = false, texture, buffer, program, vertex, fragment;
    setReady(false);
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('Artwork shader unavailable'); }
      return shader;
    };
    const picture = new Image();
    picture.crossOrigin = 'anonymous';
    const draw = () => {
      if (disposed || contextInvalid || !program || !texture || !picture.naturalWidth || gl.isContextLost()) return;
      const style = getComputedStyle(canvas.parentElement);
      const scalar = name => Number(style.getPropertyValue(name).trim()) || 1;
      const zoom = Math.max(1, ...['--lounge-art-zoom', '--lounge-art-zoom-far', '--lounge-user-zoom-far', '--lounge-user-zoom-pulse'].map(scalar));
      const { width, height, extentX: x, extentY: y } = artworkRenderGeometry(canvas.clientWidth, canvas.clientHeight, picture.naturalWidth, picture.naturalHeight, window.devicePixelRatio || 1, zoom, controls.current.fit, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      gl.viewport(0, 0, width, height); gl.useProgram(program);
      gl.uniform2f(gl.getUniformLocation(program, 'extent'), x, y);
      gl.uniform2f(gl.getUniformLocation(program, 'origin'), (1 - x) * controls.current.positionX / 100, (1 - y) * controls.current.positionY / 100);
      gl.uniform1f(gl.getUniformLocation(program, 'shift'), controls.current.chromaticOffset / Math.max(1, canvas.clientWidth) * x);
      // Read grading only on source/control/size changes, never during travel.
      // Bake it into the same retained pixels instead of filtering a second
      // full-screen compositor surface on top of the WebGL canvas.
      gl.uniform1f(gl.getUniformLocation(program, 'saturation'), scalar('--lounge-grade-saturation') * scalar('--lounge-art-saturation'));
      gl.uniform1f(gl.getUniformLocation(program, 'contrast'), scalar('--lounge-grade-contrast') * scalar('--lounge-art-contrast'));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (gl.getError() !== gl.NO_ERROR) { contextInvalid = true; setReady(false); return; }
      setReady(true);
    };
    redraw.current = draw;
    picture.onload = () => {
      if (disposed) return;
      callbacks.current.onArtworkLoad?.(picture);
      try {
        if (Math.max(picture.naturalWidth, picture.naturalHeight) > gl.getParameter(gl.MAX_TEXTURE_SIZE)) throw new Error('Artwork exceeds hardware texture size');
        vertex = compile(gl.VERTEX_SHADER, 'attribute vec2 point; varying vec2 uv; void main(){uv=point*.5+.5;gl_Position=vec4(point,0.,1.);}');
        fragment = compile(gl.FRAGMENT_SHADER, 'precision highp float; varying vec2 uv; uniform sampler2D art; uniform vec2 extent; uniform vec2 origin; uniform float shift; uniform float saturation; uniform float contrast; void main(){vec2 p=origin+vec2(uv.x,1.-uv.y)*extent;if(any(lessThan(p,vec2(0.)))||any(greaterThan(p,vec2(1.)))){gl_FragColor=vec4(0.);return;}vec4 base=texture2D(art,p);vec3 c=vec3(texture2D(art,p-vec2(shift,0.)).r,base.g,texture2D(art,p+vec2(shift,0.)).b);float l=dot(c,vec3(.213,.715,.072));c=clamp(mix(vec3(l),c,saturation),0.,1.);c=clamp((c-.5)*contrast+.5,0.,1.);gl_FragColor=vec4(c,base.a);}');
        program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Artwork shader unavailable');
        buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
        const point = gl.getAttribLocation(program, 'point'); gl.enableVertexAttribArray(point); gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
        texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture);
        if (gl.getError() !== gl.NO_ERROR) throw new Error('Artwork texture upload unavailable');
        draw();
      } catch { contextInvalid = true; setReady(false); } // Keep the source-resolution CSS fallback.
    };
    picture.onerror = () => { if (!disposed) callbacks.current.onError?.(); };
    picture.src = src;
    const observer = new ResizeObserver(draw); observer.observe(canvas);
    const lost = event => { event.preventDefault(); contextInvalid = true; setReady(false); };
    canvas.addEventListener('webglcontextlost', lost);
    const restored = () => { if (!disposed) setContextEpoch(value => value + 1); };
    canvas.addEventListener('webglcontextrestored', restored);
    return () => {
      disposed = true; redraw.current = null; picture.onload = null; picture.onerror = null; observer.disconnect(); canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored);
      if (texture) gl.deleteTexture(texture); if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program); if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment);
    };
  }, [src, contextEpoch]);
  React.useEffect(() => { redraw.current?.(); }, [chromaticOffset, positionX, positionY, saturation, contrast, zoom, fit]);
  return <div className="lounge-art-pixels absolute inset-0" data-gpu-art-ready={ready || undefined} data-safe-art-fallback={safeFallback || undefined} style={{ backgroundSize: fit, backgroundImage: ready ? 'none' : `url(${JSON.stringify(src)})` }}>
    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ visibility: ready ? 'visible' : 'hidden' }} />
  </div>;
}
