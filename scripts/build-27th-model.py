"""Brochure-based exterior reconstruction; not measured architectural geometry.
References: 27 avn.pdf pp. 1–4, 12. Eight residential floors confirmed by owner.
Exports a local GLB with batched geometry and no runtime network textures.
"""
import json, math, struct
from pathlib import Path
from collections import defaultdict
import numpy as np
G=defaultdict(lambda: {'p':[], 'n':[], 'i':[]})
materials=[('Warm ivory concrete',[.88,.86,.77,1],.9,0),('Charcoal facade',[.20,.24,.25,1],.78,0),('White balcony slabs',[.94,.93,.88,1],.85,0),('Blue grey balcony glass',[.55,.68,.72,1],.19,.28),('Dark bronze window frames',[.14,.15,.13,1],.35,.48),('Warm interior glazing',[.70,.56,.31,1],.28,.15),('Landscape green',[.25,.34,.16,1],1,0),('Paving',[.53,.55,.51,1],1,0),('Asphalt',[.20,.22,.22,1],1,0),('Stone plinth',[.66,.65,.58,1],.9,0),('Warm light',[.94,.79,.45,1],.65,0)]
def box(c,s,m=0,r=0):
 x,y,z=np.array(s)/2
 v=np.array([[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],float)
 faces=[([4,5,6,7],[0,0,1]),([1,0,3,2],[0,0,-1]),([5,1,2,6],[1,0,0]),([0,4,7,3],[-1,0,0]),([7,6,2,3],[0,1,0]),([0,1,5,4],[0,-1,0])]
 rot=np.array([[math.cos(r),0,math.sin(r)],[0,1,0],[-math.sin(r),0,math.cos(r)]])
 g=G[m]
 for ids,n in faces:
  start=len(g['p']);g['p']+=(v[ids]@rot.T+np.array(c)).tolist();g['n'] +=[(rot@np.array(n)).tolist()]*4;g['i'] +=[start+k for k in [0,1,2,0,2,3]]
def sphere(c,s,m=6):
 g=G[m];start=len(g['p']);lat,lon=6,10
 for i in range(lat+1):
  a=math.pi*i/lat
  for j in range(lon+1):
   b=2*math.pi*j/lon;n=np.array([math.sin(a)*math.cos(b),math.cos(a),math.sin(a)*math.sin(b)])
   g['p'].append((np.array(c)+n*np.array(s)).tolist());g['n'].append(n.tolist())
 for i in range(lat):
  for j in range(lon):
   a=start+i*(lon+1)+j;b=a+lon+1;g['i'] +=[a,a+1,b,b,a+1,b+1]
def facebox(x,y,z,w,h,d,side,m):
 if side in ('front','back'): box((x,y,z),(w,h,d),m)
 else:box((x,y,z),(d,h,w),m)
def balcony(a,side,f):
 y=3.4+f*3.15
 # Outer balcony edge, aligned with the actual repeated cream/grey elevation bays.
 if side=='front': x,z=a,29.05
 elif side=='back':x,z=a,-29.05
 elif side=='right':x,z=20.05,a
 else:x,z=-20.05,a
 flip=1 if side in ('front','right') else -1
 facebox(x,y,z,6.6,.22,2.4,side,2)
 edgez=z+flip*1.14 if side in ('front','back') else z
 edgex=x+flip*1.14 if side in ('right','left') else x
 facebox(edgex,y+.53,edgez,6.45,.85,.08,side,3)
 facebox(edgex,y+.99,edgez,6.6,.055,.075,side,4)
 for t in [-3.2,-2.1,-1.05,0,1.05,2.1,3.2]:
  facebox(edgex+t if side in ('front','back') else edgex,y+.56,edgez if side in ('front','back') else edgez+t,.035,.91,.045,side,4)
 # Sliding glazed doors, inset at the face of the building.
 dz=flip*-1.18
 wx=x if side in ('front','back') else x+dz
 wz=z+dz if side in ('front','back') else z
 facebox(wx,y+1.38,wz,5.3,2.35,.12,side,4)
 facebox(wx,y+1.38,wz+flip*.075 if side in ('front','back') else wz,5.12,2.17,.04,side,5)
 # Mullions split the warm lit windows.
 for t in [-2.52,-1.27,0,1.27,2.52]:
  facebox(wx+t if side in ('front','back') else wx+flip*.07,y+1.38,wz+flip*.08 if side in ('front','back') else wz+t,.055,2.25,.055,side,4)
 # Side returns and planter at the ends.
 if side in ('front','back'):
  box((x-3.25,y+.52,z),( .13,.92,2.25),2);box((x+3.25,y+.52,z),(.13,.92,2.25),2)
 else:
  box((x,y+.52,z-3.25),(2.25,.92,.13),2);box((x,y+.52,z+3.25),(2.25,.92,.13),2)
 box((x-2.7 if side in ('front','back') else x,y+.34,z if side in ('front','back') else z-2.7),(.45,.32,.45),9)
 sphere((x-2.7 if side in ('front','back') else x,y+.64,z if side in ('front','back') else z-2.7),(.26,.37,.26))
# Landscaped boundary and a raised stilt-level podium.
box((0,-.22,0),(51,.4,72),7);box((0,.04,0),(40,.35,58),9)
box((0,-.09,37.5),(51,.12,6),8);box((24,-.09,0),(5,.12,72),8)
for x in [-23,23]:box((x,.55,0),(.32,1.2,69),2)
box((0,.55,-34.5),(46,1.2,.3),2)
for x in [-16,16]:box((x,.55,34.3),(13,1.2,.3),2)
for x in [-6.5,6.5]:box((x,1.3,34.3),(.45,2.7,.5),1)
for x in np.arange(-6,6,.4):box((float(x),.95,34.3),(.07,1.9,.08),4)
box((0,1.95,34.3),(12,.08,.08),4)
# Two apartment wings linked by circulation cores, with open-to-sky courts.
height=8*3.15
for z in [-18,18]:
 for x in [-13.5,-4.5,4.5,13.5]:box((x,3.3+height/2,z),(8.75,height,19.8),0)
 # Recessed grey circulation band.
 box((0,3.3+height/2,z),(2.1,height,20.1),1)
for x in [-13.5,13.5]:box((x,3.3+height/2,0),(9,height,16.6),0)
for x in [-16.8,-8.4,8.4,16.8]:
 for z in [-28.05,28.05]:
  box((x,3.15+height/2,z),(1.15,height+1,1.0),1)
  box((x+(.7 if x<0 else -.7),3.15+height/2,z+(.12 if z>0 else -.12)),(.36,height+1,.25),2)
# Pilotis/stilt parking; no residential units are invented on parking levels.
for x in [-17,-8.5,0,8.5,17]:
 for z in [-25,-12,12,25]:box((x,1.65,z),(.6,3.3,.6),2)
for f in range(8):
 for x in [-13.5,-4.5,4.5,13.5]:
  balcony(x,'front',f);balcony(x,'back',f)
 for z in [-24,-16,-8,8,16,24]:
  balcony(z,'left',f);balcony(z,'right',f)
 # Tall corner strips with small punched windows.
 for x in [-18.1,18.1]:
  for z in [-27,27]:box((x,4.7+f*3.15,z),(.85,1.3,.13),5)
# Roof cornices and charcoal pergola frames, echoing the brochure's skyline.
roof=3.3+height
for z in [-18,18]:
 box((0,roof+.16,z),(37.6,.34,21.4),2)
 for x in [-13.5,-4.5,4.5,13.5]:
  box((x,roof+.8,z+(7 if z>0 else -7)),(8.2,1.2,.3),0)
  box((x,roof+2.2,z+(7 if z>0 else -7)),(8.6,.35,6.5),1)
  for t in np.arange(-3.6,3.7,.65):box((x+float(t),roof+2.05,z+(7 if z>0 else -7)),(.11,.18,6.1),2)
  for dx in [-3.8,3.8]:box((x+dx,roof+1.1,z+(10 if z>0 else -10)),(.28,2.2,.28),2)
for x in [-13.5,13.5]:box((x,roof+.16,0),(9.6,.34,17.2),2)
# Roof service blocks and restrained landscaping.
for z in [-7,7]:box((0,roof+1.2,z),(3,2.4,3),2)
for x in [-20,20]:
 for z in [-31,-18,-4,12,29]:
  box((x,.3,z),(2,.55,2.2),9);sphere((x,1.5,z),(.85,1.3,.9))
for x in [-15,-9,9,15]:
 box((x,.15,31),(4,.2,3),6)
for x in [-17,17]:
 box((x,1.2,32),(.22,2.4,.22),9);sphere((x,3.4,32),(1.4,1.8,1.4))
# Batched GLB primitives: one draw call per material, no texture downloads.
blob=bytearray();views=[];accessors=[];prims=[]
def accessor(a,kind,component,target):
 while len(blob)%4:blob.append(0)
 start=len(blob);raw=a.tobytes();blob.extend(raw);vi=len(views);views.append({'buffer':0,'byteOffset':start,'byteLength':len(raw),'target':target})
 o={'bufferView':vi,'componentType':component,'count':len(a),'type':kind}
 if kind=='VEC3':o.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
 accessors.append(o);return len(accessors)-1
for m,g in sorted(G.items()):
 p=np.asarray(g['p'],dtype='<f4');n=np.asarray(g['n'],dtype='<f4');idx=np.asarray(g['i'],dtype='<u4')
 prims.append({'attributes':{'POSITION':accessor(p,'VEC3',5126,34962),'NORMAL':accessor(n,'VEC3',5126,34962)},'indices':accessor(idx,'SCALAR',5125,34963),'material':m})
mat=[]
for name,color,rough,metal in materials:mat.append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':metal,'roughnessFactor':rough},'doubleSided':False})
model={'asset':{'version':'2.0','generator':'Aawaash brochure reconstruction','extras':{'source':'27 avn.pdf pp 1–4,12','residentialFloors':8,'dimensionAccuracy':'approximate; not construction geometry'}},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':'27th Avenue — brochure-based exterior'}],'meshes':[{'primitives':prims}],'materials':mat,'buffers':[{'byteLength':len(blob)}],'bufferViews':views,'accessors':accessors}
j=json.dumps(model,separators=(',',':')).encode();j+=b' '*((-len(j))%4);blob+=b'\0'*((-len(blob))%4)
out=struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(blob))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(blob),b'BIN\0')+blob
path=Path('public/projects/27th-avenue/27th-avenue-exterior.glb');path.write_bytes(out)
print(json.dumps({'file':str(path),'bytes':len(out),'triangles':sum(len(g['i'])//3 for g in G.values()),'materials':len(mat),'residential_floors':8}))
