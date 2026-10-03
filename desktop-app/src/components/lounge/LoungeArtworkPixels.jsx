import React from 'react';

// Static GPU draw per image/size/control change; CSS animates the parent.
export default function LoungeArtworkPixels({ src, chromaticOffset, positionX = 50, positionY = 50, saturation = 1, contrast = 1 }) {
  const canvasRef = React.useRef(null);
  const controls = React.useRef({ chromaticOffset, positionX, positionY });
  controls.current = { chromaticOffset, positionX, positionY };
  const redraw = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true });
    if (!gl) return undefined;
    let disposed = false, texture, buffer, program, vertex, fragment;
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
      if (disposed || !program || !texture || !picture.naturalWidth || gl.isContextLost()) return;
      const width = Math.max(1, Math.round(canvas.clientWidth * (window.devicePixelRatio || 1))), height = Math.max(1, Math.round(canvas.clientHeight * (window.devicePixelRatio || 1)));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      gl.viewport(0, 0, width, height); gl.useProgram(program);
      const scale = Math.max(width / picture.naturalWidth, height / picture.naturalHeight);
      const x = width / (picture.naturalWidth * scale), y = height / (picture.naturalHeight * scale);
      gl.uniform2f(gl.getUniformLocation(program, 'extent'), x, y);
      gl.uniform2f(gl.getUniformLocation(program, 'origin'), (1 - x) * controls.current.positionX / 100, (1 - y) * controls.current.positionY / 100);
      gl.uniform1f(gl.getUniformLocation(program, 'shift'), controls.current.chromaticOffset * (window.devicePixelRatio || 1) / width * x);
      // Read grading only on source/control/size changes, never during travel.
      // Bake it into the same retained pixels instead of filtering a second
      // full-screen compositor surface on top of the WebGL canvas.
      const style = getComputedStyle(canvas.parentElement);
      const scalar = name => Number(style.getPropertyValue(name).trim()) || 1;
      gl.uniform1f(gl.getUniformLocation(program, 'saturation'), scalar('--lounge-grade-saturation') * scalar('--lounge-art-saturation'));
      gl.uniform1f(gl.getUniformLocation(program, 'contrast'), scalar('--lounge-grade-contrast') * scalar('--lounge-art-contrast'));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); setReady(true);
    };
    redraw.current = draw;
    picture.onload = () => {
      if (disposed) return;
      try {
        vertex = compile(gl.VERTEX_SHADER, 'attribute vec2 point; varying vec2 uv; void main(){uv=point*.5+.5;gl_Position=vec4(point,0.,1.);}');
        fragment = compile(gl.FRAGMENT_SHADER, 'precision mediump float; varying vec2 uv; uniform sampler2D art; uniform vec2 extent; uniform vec2 origin; uniform float shift; uniform float saturation; uniform float contrast; void main(){vec2 p=origin+vec2(uv.x,1.-uv.y)*extent;vec3 c=vec3(texture2D(art,p-vec2(shift,0.)).r,texture2D(art,p).g,texture2D(art,p+vec2(shift,0.)).b);float l=dot(c,vec3(.213,.715,.072));c=clamp(mix(vec3(l),c,saturation),0.,1.);c=clamp((c-.5)*contrast+.5,0.,1.);gl_FragColor=vec4(c,1.);}');
        program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Artwork shader unavailable');
        buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
        const point = gl.getAttribLocation(program, 'point'); gl.enableVertexAttribArray(point); gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
        texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, picture); draw();
      } catch { setReady(false); } // Keep the existing CSS effect as fallback.
    };
    picture.src = src;
    const observer = new ResizeObserver(draw); observer.observe(canvas);
    const lost = event => { event.preventDefault(); setReady(false); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => {
      disposed = true; redraw.current = null; picture.onload = null; observer.disconnect(); canvas.removeEventListener('webglcontextlost', lost);
      if (texture) gl.deleteTexture(texture); if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program); if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment);
    };
  }, [src]);
  React.useEffect(() => { redraw.current?.(); }, [chromaticOffset, positionX, positionY, saturation, contrast]);
  return <div className="lounge-art-pixels absolute inset-0" data-gpu-art-ready={ready || undefined} style={{ backgroundImage: ready ? 'none' : `url(${JSON.stringify(src)})` }}>
    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ visibility: ready ? 'visible' : 'hidden' }} />
  </div>;
}
