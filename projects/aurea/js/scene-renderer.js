// The visual layer is independent of scrolling: a normalized 0..1 timeline
// controls a reversible GPU dolly and a soft expanding portal between images.
const vertex = `attribute vec2 aPosition; varying vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
const fragment = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uStone;uniform sampler2D uLounge;uniform sampler2D uRoom;
uniform vec2 uResolution;uniform vec2 uImage;uniform float uProgress;
vec2 cover(vec2 uv,float scale,vec2 center){
 float view=uResolution.x/uResolution.y;float image=uImage.x/uImage.y;
 vec2 fit=view>image?vec2(1.,image/view):vec2(view/image,1.);
 return clamp((uv-.5)*fit/scale+center,vec2(.001),vec2(.999));
}
float portal(float t,vec2 origin){
 vec2 point=vUv-origin;point.x*=uResolution.x/uResolution.y;
 float extent=length(vec2(uResolution.x/uResolution.y,1.));
 float radius=mix(-.2,extent,t);
 return 1.-smoothstep(radius-.12,radius+.12,length(point));
}
void main(){
 float p=uProgress;
 float enter=smoothstep(.17,.39,p);float exit=smoothstep(.58,.80,p);
 float stoneZoom=1.+1.75*smoothstep(0.,.40,p);
 float loungeZoom=1.+1.05*smoothstep(.36,.81,p);
 float roomZoom=mix(1.24,1.,smoothstep(.69,1.,p));
 vec2 uv=vUv;
 float wave=sin((uv.x+uv.y)*24.+p*14.)*.003*sin(enter*3.14159);
 vec4 stone=texture2D(uStone,cover(uv+wave,stoneZoom,vec2(.5,.5)));
 vec4 lounge=texture2D(uLounge,cover(uv,loungeZoom,vec2(.5,.5)));
 vec4 room=texture2D(uRoom,cover(uv,roomZoom,vec2(.5,.5)));
 vec4 col=mix(stone,lounge,portal(enter,vec2(.59,.49)));
 col=mix(col,room,portal(exit,vec2(.5,.5)));
 gl_FragColor=vec4(col.rgb,1.);
}`;

window.SceneRenderer=class SceneRenderer {
 constructor(canvas){
  this.canvas=canvas;
  this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
  if(!this.gl)throw new Error('WebGL unavailable');
  const gl=this.gl;
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
  this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);
  if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error('Scene shader linking failed');
  gl.useProgram(this.program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(this.program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  this.uniforms=Object.fromEntries(['uResolution','uImage','uProgress','uStone','uLounge','uRoom'].map(n=>[n,gl.getUniformLocation(this.program,n)]));
 }
 async load(sources){
  const images=await Promise.all(sources.map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;})));
  const gl=this.gl; const max=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),innerWidth<768?2048:4096);
  images.forEach((image,i)=>{
   // Bound texture memory on mobile GPUs while preserving the animated scene.
   let source=image;if(image.width>max||image.height>max){source=document.createElement('canvas');const factor=max/Math.max(image.width,image.height);source.width=Math.floor(image.width*factor);source.height=Math.floor(image.height*factor);source.getContext('2d').drawImage(image,0,0,source.width,source.height);}
   const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.uniform1i(this.uniforms[['uStone','uLounge','uRoom'][i]],i);
  });
  if(gl.isContextLost()||gl.getError()!==gl.NO_ERROR)throw new Error('Texture upload failed');
  gl.uniform2f(this.uniforms.uImage,images[0].width,images[0].height);this.ready=true;
 }
 render(progress){
  if(!this.ready)return;
  const gl=this.gl;const rect=this.canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,innerWidth<768?1.25:1.5);
  const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr);
  if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;gl.viewport(0,0,width,height);}
  gl.uniform2f(this.uniforms.uResolution,width,height);gl.uniform1f(this.uniforms.uProgress,progress);gl.drawArrays(gl.TRIANGLES,0,6);
 }
}
