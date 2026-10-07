/* Scroll-directed cinematic renderer. WebGL planet and lens + projected 3D objects. */
window.Cosmos=class Cosmos{
 constructor(canvas,objects){
  this.canvas=canvas;this.overlay=objects;this.ctx=objects.getContext('2d');this.stars=Array.from({length:190},(_,i)=>({x:Math.sin(i*137.51)*1.7,y:Math.cos(i*43.71),z:(i*.6180339)%1,size:i%9===0?1.8:.8}));
  this.images={};
  const base=document.documentElement.lang==='en'?'../':'';
  for(const [name,file] of [['hole','blackhole.webp'],['earth','earth.jpg']]){
   const image=new Image();this.images[name]=image;
   image.onload=()=>this.onReady?.();image.src=base+'assets/'+file;
  }
  this.initGL();
 }
 initGL(){
  try{
  const canvas=this.canvas;
  this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
  if(!this.gl){this.canvas.style.opacity='0';return;}const gl=this.gl;this.canvas.style.opacity='1';
  const vertex=`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
  const fragment=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
  varying vec2 vUv;uniform vec2 uResolution;uniform float uProgress;uniform float uTime;uniform sampler2D uHole;uniform sampler2D uEarth;uniform float uLoaded;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
  float fbm(vec2 p){return noise(p)*.5+noise(p*2.03)*.25+noise(p*4.07)*.125;}
  mat2 rotate(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
  void main(){
   float p=uProgress,t=uTime,aspect=uResolution.x/uResolution.y;vec2 q=(vUv-.5)*vec2(aspect,1.);vec3 color=vec3(.013,.022,.039);
   float nebula=fbm(q*2.+vec2(t*.003,0.));color+=vec3(.025,.045,.075)*nebula*exp(-length(q-vec2(.4,.2)));
   float bh=(.7+.3*smoothstep(.075,.12,p))*(1.-smoothstep(.28,.32,p));
   if(bh>.001){
    float zoom=1.+pow(smoothstep(.17,.30,p),3.)*32.;vec2 fit=aspect>1.777?vec2(1.,1.777/aspect):vec2(aspect/1.777,1.);
    vec2 center=mix(aspect<1.?vec2(.673,.33):vec2(.5),vec2(.673,.552),smoothstep(.12,.26,p));vec2 uv=(vUv-.5)*fit/zoom+center;
    vec2 d=uv-vec2(.673,.552);d.x*=1.777;float r=length(d);float angle=t*.018*(1.-smoothstep(.2,.65,r));d=rotate(angle)*d;d.x/=1.777;
    vec3 hole=texture2D(uHole,clamp(d+vec2(.673,.552),.001,.999)).rgb;
    color=mix(color,hole,bh);
   }
   float tunnel=smoothstep(.275,.315,p)*(1.-smoothstep(.385,.415,p));
   if(tunnel>.001){
    vec2 w=rotate(t*.03+p*4.)*q;float r=max(length(w),.006),a=atan(w.y,w.x);
    float depth=1./(r+.05)+p*90.+t*.24;
    float rings=pow(.5+.5*sin(depth*3.+fbm(vec2(a*4.,depth*.1))*3.),6.);
    float rays=pow(.5+.5*sin(a*49.+depth*.09),24.);
    vec3 worm=(vec3(.13,.27,.43)*rings+vec3(.6,.31,.12)*rays)*smoothstep(.035,.3,r);
    worm+=vec3(.08,.14,.2)*exp(-r*5.);color=mix(color,worm,tunnel);
   }
   float earthFade=smoothstep(.39,.425,p)*(1.-smoothstep(.81,.92,p));
   if(earthFade>.001){
    float orbit=smoothstep(.49,.72,p);float depart=smoothstep(.7,.89,p);
    vec2 ec=vec2(aspect<1.?0.:aspect*.28,aspect<1.?.20:-.015);ec+=vec2(sin(orbit*3.14)*.08,0.);
    float radius=mix(.35,.46,orbit);radius=mix(radius,.16,depart);if(aspect<1.)radius*=.8;
    vec2 v=(q-ec)/radius;float r2=dot(v,v);vec3 planet=vec3(0.);
    if(r2<1.){
     vec3 n=vec3(v,sqrt(1.-r2));vec3 world=n;world.yz=rotate(-.24)*world.yz;world.xz=rotate(orbit*2.8+t*.012+.45)*world.xz;
     vec2 uv=vec2(atan(world.z,world.x)/6.283185+.5,asin(clamp(world.y,-1.,1.))/3.141592+.5);
     vec3 surface=texture2D(uEarth,uv).rgb;
     float sun=max(dot(n,normalize(vec3(-.9,.6,.75))),0.);float rim=pow(1.-n.z,3.);
     planet=surface*(.065+sun*1.12)+vec3(.12,.38,.72)*rim*.7;
     float city=pow(noise(uv*600.),22.)*(1.-smoothstep(0.,.2,sun));planet+=vec3(1.,.6,.18)*city*.8;
     color=mix(color,planet,earthFade);
    }
    float atmosphere=exp(-abs(sqrt(r2)-1.)*45.)*.6;
    color+=vec3(.12,.42,.8)*atmosphere*earthFade;
    float blast=smoothstep(.449,.458,p)*(1.-smoothstep(.468,.51,p));vec2 impact=ec+vec2(-.18,.16)*radius/.35;
    float distance=length(q-impact),ringRadius=max(0.,p-.454)*8.;
    float fire=exp(-distance*18.)*blast;float shock=exp(-abs(distance-ringRadius)*95.)*blast;
    color+=vec3(1.,.44,.12)*fire*2.+vec3(.6,.8,1.)*shock*.6;
    color=mix(color,vec3(.8,.86,.91),blast*.18);
   }
   float arrival=smoothstep(.86,.94,p);float halo=exp(-abs(length(q-vec2(0.,-.95))-.9)*35.);color+=vec3(.15,.25,.42)*halo*arrival;
   color*=1.-smoothstep(.3,1.3,length(q))*.24;
   gl_FragColor=vec4(color,1.);
  }`;
  const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error('Shader link failed');gl.useProgram(this.program);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(this.program,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  this.u=Object.fromEntries(['uResolution','uProgress','uTime','uHole','uEarth'].map(k=>[k,gl.getUniformLocation(this.program,k)]));
  // Reuse local images for both the GPU scene and the Canvas fallback.
  for(let i=0;i<2;i++){
   gl.activeTexture(gl.TEXTURE0+i);const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([4,9,16]));
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.uniform1i(this.u[i?'uEarth':'uHole'],i);
   const image=this.images[i?'earth':'hole'];
   const upload=()=>{if(this.gl!==gl||gl.isContextLost())return;try{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);this.onReady?.();}catch(error){this.useFallback();}};
   if(image.complete&&image.naturalWidth)upload();else image.addEventListener('load',upload,{once:true});
  }
  }catch(error){this.useFallback();}
 }
 useFallback(){this.gl=null;this.canvas.style.opacity='0';this.onReady?.();}

 resize(){const dpr=Math.min(window.devicePixelRatio||1,this.overlay.clientWidth<768?1:1.4);this.w=this.overlay.clientWidth;this.h=this.overlay.clientHeight;for(const c of [this.canvas,this.overlay]){const w=Math.round(this.w*dpr),h=Math.round(this.h*dpr);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}}this.ctx.setTransform(dpr,0,0,dpr,0,0);if(this.gl)this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
 render(p,t,still=false){this.resize();if(this.gl){const g=this.gl;g.useProgram(this.program);g.uniform2f(this.u.uResolution,this.canvas.width,this.canvas.height);g.uniform1f(this.u.uProgress,p);g.uniform1f(this.u.uTime,t);g.drawArrays(g.TRIANGLES,0,6);}const c=this.ctx,w=this.w,h=this.h;c.clearRect(0,0,w,h);
  const smooth=(a,b,x)=>{let v=Math.max(0,Math.min(1,(x-a)/(b-a)));return v*v*(3-2*v);};
  const globe=this.earthGeometry(p);
  if(!this.gl)this.renderFallback(p,t,globe);
  let visibility=(1-smooth(.13,.22,p))+(smooth(.37,.42,p)*(1-smooth(.43,.53,p)))*.35+smooth(.66,.77,p);visibility=Math.min(1,visibility);
  const speed=still?0:(p<.1?.055:p>.27&&p<.41?.4:.016);const travel=t*speed+p*7;
  for(const s of this.stars){const z=.12+((s.z+1-travel%1)%1)*1.7;const x=w/2+s.x*h*.55/z,y=h/2+s.y*h*.55/z;if(x<0||x>w||y<0||y>h)continue;if(globe.alpha>.5&&Math.hypot(x-globe.x,y-globe.y)<globe.radius)continue;const a=(.25+(.95-z/2)*.55)*visibility;c.strokeStyle=`rgba(187,208,235,${a})`;c.fillStyle=c.strokeStyle;c.lineWidth=s.size*.7;const trail=(still?0:(p<.08?.02:.006))*(1/z);c.beginPath();c.moveTo(x,y);c.lineTo(x+(x-w/2)*trail,y+(y-h/2)*trail);c.stroke();c.fillRect(x,y,s.size/z,s.size/z);}

  // A scroll-driven meteor meets the visible planet surface before the impact bloom.
  if(p>.413&&p<.457){const v=(p-.413)/.044;const mobile=w<h;const endX=mobile?w/2-h*.144:w*.78-h*.18,endY=mobile?h*.3-h*.128:h*.515-h*.16;const x=w*1.1+(endX-w*1.1)*v,y=-h*.12+(endY+h*.12)*v;const g=c.createLinearGradient(x,y,x+100,y-70);g.addColorStop(0,'#fff3c7');g.addColorStop(.2,'#fbb17c');g.addColorStop(1,'#ee8a3100');c.strokeStyle=g;c.lineWidth=3+v*5;c.beginPath();c.moveTo(x,y);c.lineTo(x+130,y-92);c.stroke();c.fillStyle='#fff0ce';c.beginPath();c.arc(x,y,3+v*3,0,7);c.fill();}
  const satelliteAlpha=smooth(.64,.69,p)*(1-smooth(.865,.91,p))*globe.alpha;
  if(satelliteAlpha>0){
   const angle=t*.32+(p-.64)*Math.PI*9,orbitRadius=globe.radius*1.48,depth=Math.sin(angle),perspective=1+depth*.12;
   const ox=Math.cos(angle)*orbitRadius*perspective,oy=Math.sin(angle)*orbitRadius*.32*perspective;
   const tilt=-.28,dx=ox*Math.cos(tilt)-oy*Math.sin(tilt),dy=ox*Math.sin(tilt)+oy*Math.cos(tilt);
   c.save();c.globalAlpha=satelliteAlpha;
   // Clip the far half of the orbit against the planetary silhouette.
   c.save();c.beginPath();c.rect(0,0,w,h);c.moveTo(globe.x+globe.radius+1,globe.y);c.arc(globe.x,globe.y,globe.radius+1,0,Math.PI*2);c.clip('evenodd');
   c.strokeStyle='#9fc8e533';c.lineWidth=.7;c.beginPath();c.ellipse(globe.x,globe.y,orbitRadius,orbitRadius*.32,tilt,0,Math.PI*2);c.stroke();c.restore();
   if(depth<0){c.beginPath();c.rect(0,0,w,h);c.moveTo(globe.x+globe.radius+1,globe.y);c.arc(globe.x,globe.y,globe.radius+1,0,Math.PI*2);c.clip('evenodd');}
   this.satellite(globe.x+dx,globe.y+dy,globe.radius*.19*perspective,t*.07+angle*.35);c.restore();
  }
  if(p>.66&&!still){for(let i=0;i<3;i++){const v=(t*.07+i*.31+p)%1;const x=w*(1.2-v*1.5),y=h*(.08+i*.21+v*.18);c.strokeStyle=`rgba(191,206,226,${Math.sin(v*Math.PI)*.35})`;c.lineWidth=.8;c.beginPath();c.moveTo(x,y);c.lineTo(x+45,y-16);c.stroke();}}
 }
 renderFallback(p,t,globe){
  const c=this.ctx,w=this.w,h=this.h;
  const smooth=(a,b,x)=>{const v=Math.max(0,Math.min(1,(x-a)/(b-a)));return v*v*(3-2*v);};
  const hole=this.images.hole,earth=this.images.earth;
  c.fillStyle='#050a13';c.fillRect(0,0,w,h);
  const fade=(.7+.3*smooth(.075,.12,p))*(1-smooth(.28,.32,p));
  if(fade>0&&hole.complete&&hole.naturalWidth){
   const zoom=1+Math.pow(smooth(.17,.30,p),3)*22,ratio=hole.naturalWidth/hole.naturalHeight;
   const dw=Math.max(w,h*ratio)*zoom,dh=dw/ratio;
   const destinationX=w/2,destinationY=h*(w<h?.29:.45);
   c.save();c.globalAlpha=fade;c.translate(destinationX,destinationY);c.rotate(Math.sin(t*.06)*.012);
   c.drawImage(hole,-dw*.673,-dh*.448,dw,dh);c.restore();
  }
  const tunnel=smooth(.275,.315,p)*(1-smooth(.385,.415,p));
  if(tunnel>0){
   c.save();c.globalAlpha=tunnel;c.translate(w/2,h/2);c.rotate(t*.035+p*4);
   for(let i=0;i<36;i++){
    const z=(i/36+p*7+t*.12)%1,r=18+z*z*Math.max(w,h),a=i*2.39996;
    c.strokeStyle=i%3?'#729eca88':'#e4af7b77';c.lineWidth=1+z*2;
    c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*r*(1.2+z),Math.sin(a)*r*(1.2+z));c.stroke();
   }c.restore();
  }
  if(globe.alpha>0){
   const {x,y,radius:r,alpha}=globe;c.save();c.globalAlpha=alpha;
   c.shadowColor='#518ee5';c.shadowBlur=20;c.fillStyle='#122c4d';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.shadowBlur=0;
   c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();
   if(earth.complete&&earth.naturalWidth){
    const turn=(smooth(.49,.72,p)*.42+t*.004)%1,offset=turn*r*4;
    c.drawImage(earth,x-r-offset,y-r,r*4,r*2);c.drawImage(earth,x-r-offset+r*4,y-r,r*4,r*2);
   }
   const shade=c.createRadialGradient(x-r*.4,y-r*.35,r*.1,x,y,r);
   shade.addColorStop(0,'#b9dfff10');shade.addColorStop(.5,'#01050b10');shade.addColorStop(1,'#01050be6');c.fillStyle=shade;c.fillRect(x-r,y-r,r*2,r*2);
   const night=c.createLinearGradient(x-r,y,x+r,y+r*.4);night.addColorStop(0,'#02051000');night.addColorStop(.5,'#02051022');night.addColorStop(1,'#020510e6');c.fillStyle=night;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
   c.strokeStyle='#8fc4ff88';c.lineWidth=1.4;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.restore();
  }
  const blast=smooth(.449,.458,p)*(1-smooth(.468,.51,p));
  if(blast>0){
   const x=globe.x-globe.radius*.514,y=globe.y-globe.radius*.457,r=Math.max(10,(p-.449)*h*8);
   c.save();c.globalAlpha=blast;const glow=c.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,'#ffefc8');glow.addColorStop(.16,'#ee985ccc');glow.addColorStop(1,'#e56f2300');c.fillStyle=glow;c.fillRect(x-r,y-r,r*2,r*2);c.strokeStyle='#dcecff99';c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.restore();
  }
 }
 earthGeometry(p){
  const smooth=(a,b,x)=>{const v=Math.max(0,Math.min(1,(x-a)/(b-a)));return v*v*(3-2*v);};
  const orbit=smooth(.49,.72,p),depart=smooth(.7,.89,p),mobile=this.w<this.h;
  let radius=.35+(.46-.35)*orbit;radius=radius+(.16-radius)*depart;if(mobile)radius*=.8;
  return {x:this.w*(mobile?.5:.78)+Math.sin(orbit*3.14)*.08*this.h,y:this.h*(mobile?.30:.515),radius:radius*this.h,alpha:smooth(.39,.425,p)*(1-smooth(.81,.92,p))};
 }
 satellite(cx,cy,scale,angle){const c=this.ctx;const project=([x,y,z])=>{let xx=x*Math.cos(angle)+z*Math.sin(angle),zz=-x*Math.sin(angle)+z*Math.cos(angle);let yy=y*Math.cos(.5)-zz*Math.sin(.5);zz=y*Math.sin(.5)+zz*Math.cos(.5);const f=3.8/(3.8+zz);return [cx+(xx*Math.cos(-.3)-yy*Math.sin(-.3))*scale*f,cy+(xx*Math.sin(-.3)+yy*Math.cos(-.3))*scale*f];};const poly=(vs,color,stroke='#9dafc466')=>{c.beginPath();vs.forEach((v,i)=>{let p=project(v);i?c.lineTo(...p):c.moveTo(...p);});c.closePath();c.fillStyle=color;c.fill();c.strokeStyle=stroke;c.lineWidth=.7;c.stroke();};const line=(a,b,color='#adbed0',width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...project(a));c.lineTo(...project(b));c.stroke();};
  line([-1.6,0,0],[1.6,0,0],'#c2ccd8',3);
  for(const side of [-1,1]){const x=side*.48;poly([[x,-.5,0],[side*1.65,-.5,0],[side*1.65,.5,0],[x,.5,0]],'#132e4b','#7d9bb4');for(let i=1;i<6;i++)line([x+side*i*.195,-.5,0],[x+side*i*.195,.5,0],'#6a89aa88',.7);for(let i=1;i<4;i++)line([x,-.5+i*.25,0],[side*1.65,-.5+i*.25,0],'#648aaa88',.7);}
  poly([[-.29,-.36,-.2],[.29,-.36,-.2],[.29,.36,-.2],[-.29,.36,-.2]],'#b9a57b');poly([[.29,-.36,-.2],[.29,-.36,.3],[.29,.36,.3],[.29,.36,-.2]],'#655d4f');poly([[-.29,-.36,.3],[.29,-.36,.3],[.29,.36,.3],[-.29,.36,.3]],'#d3c297');poly([[-.29,-.36,-.2],[.29,-.36,-.2],[.29,-.36,.3],[-.29,-.36,.3]],'#e7e4d6');
  line([0,-.35,.05],[0,-.86,.05],'#ccd6df',2);const dish=[];for(let i=0;i<24;i++){let a=i/24*6.283;dish.push([Math.cos(a)*.31,-.73+Math.sin(a)*.1,.06+Math.sin(a)*.26]);}poly(dish,'#b9c8d4');line([0,-.74,.05],[0,-1.02,.05],'#eef2f4',1.5);
 }
};
