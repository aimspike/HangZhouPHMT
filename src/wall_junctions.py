"""Fill only missing outside quadrants at orthogonal wall endpoints.

The centreline boxes stop at their axes, leaving a quarter-square notch at L
corners. Derive small, non-overlapping infills without changing any opening.
"""
import math

EPS=1e-7

def junction_fills(layout):
    walls=layout['walls']; candidates=[]
    def horizontal(w):return w['a'][1]==w['b'][1]
    def solid(w,x,z,y):
        along=horizontal(w);a,b=w['a'],w['b'];u=x if along else z;v=z if along else x
        start=min(a[0 if along else 1],b[0 if along else 1]);end=max(a[0 if along else 1],b[0 if along else 1])
        if not(start-EPS<=u<=end+EPS and abs(v-a[1 if along else 0])<=w['t']/2+EPS and 0<=y<(w.get('height',2.96)-EPS)):return False
        for op in w.get('openings',[]):
            if op['a']+EPS<u-start<op['b']-EPS:
                return not ((op['kind']=='window' and .9<y<2.3) or (op['kind']!='window' and y<2.1))
        return True
    def bearing(w,p):
        along=horizontal(w)
        return any(abs(s['t']-w['t'])<EPS and s['a'][1 if along else 0]==p[1 if along else 0] and
                   min(s['a'][0 if along else 1],s['b'][0 if along else 1])-EPS<=p[0 if along else 1]<=max(s['a'][0 if along else 1],s['b'][0 if along else 1])+EPS for s in layout['bearing'])
    for h in filter(horizontal,walls):
        for v in filter(lambda w:not horizontal(w),walls):
            for hp in h['a'],h['b']:
                for vp in v['a'],v['b']:
                    if math.dist(hp,vp)>EPS:continue
                    x,z=hp;hx=(h['b'][0] if hp==h['a'] else h['a'][0])-x;vz=(v['b'][1] if vp==v['a'] else v['a'][1])-z
                    xx=sorted([x,x-math.copysign(v['t']/2,hx)]);zz=sorted([z,z-math.copysign(h['t']/2,vz)])
                    candidates.append({'x':xx,'z':zz,'height':min(h.get('height',2.96),v.get('height',2.96)),
                        'bearing':bearing(h,hp) or bearing(v,vp),'walls':[h['id'],v['id']],'corner':[x,z]})
    fills=[]
    for c in candidates:
        # Split at existing footprints and height transitions; never double-fill.
        xs=set(c['x']);zs=set(c['z']);ys={0,c['height']}
        for w in walls:
            a,b=w['a'],w['b'];t=w['t']/2
            wx=[min(a[0],b[0])-(0 if horizontal(w) else t),max(a[0],b[0])+(0 if horizontal(w) else t)]
            wz=[min(a[1],b[1])-(t if horizontal(w) else 0),max(a[1],b[1])+(t if horizontal(w) else 0)]
            if wx[1]<=c['x'][0]+EPS or wx[0]>=c['x'][1]-EPS or wz[1]<=c['z'][0]+EPS or wz[0]>=c['z'][1]-EPS:continue
            xs.update(p for p in wx if c['x'][0]<p<c['x'][1]);zs.update(p for p in wz if c['z'][0]<p<c['z'][1])
            if 0<w.get('height',2.96)<c['height']:ys.add(w['height'])
        xs,zs,ys=sorted(xs),sorted(zs),sorted(ys)
        for lo,hi in zip(ys,ys[1:]):
            for xa,xb in zip(xs,xs[1:]):
                for za,zb in zip(zs,zs[1:]):
                    x,z,y=(xa+xb)/2,(za+zb)/2,(lo+hi)/2
                    # A full-height corner owns the return even where a low
                    # parapet meets it, so overview guard cutting cannot reopen it.
                    if any(solid(w,x,z,y) for w in walls if not(w.get('guard') and c['height']>.95)):continue
                    if any(f['min'][0]-EPS<x<f['max'][0]+EPS and f['min'][1]-EPS<z<f['max'][1]+EPS and f['lo']-EPS<y<f['hi']+EPS for f in fills):continue
                    fills.append({'min':[round(xa,6),round(za,6)],'max':[round(xb,6),round(zb,6)],'lo':lo,'hi':hi,
                                  'guard':c['height']<=.95,'bearing':c['bearing'],'walls':c['walls'],'corner':c['corner']})
    changed=True
    while changed:
        changed=False
        for i,a in enumerate(fills):
            for j in range(i+1,len(fills)):
                b=fills[j]
                if any(a[k]!=b[k] for k in ['guard','bearing','walls','corner']):continue
                boxes=[(a['min'][0],a['max'][0],b['min'][0],b['max'][0]),(a['min'][1],a['max'][1],b['min'][1],b['max'][1]),(a['lo'],a['hi'],b['lo'],b['hi'])]
                for axis in range(3):
                    if not all(abs(p-r)<EPS and abs(q-s)<EPS for n,(p,q,r,s) in enumerate(boxes) if n!=axis):continue
                    p,q,r,s=boxes[axis]
                    if abs(q-r)>EPS and abs(s-p)>EPS:continue
                    if axis<2:a['min'][axis]=min(p,r);a['max'][axis]=max(q,s)
                    else:a['lo']=min(p,r);a['hi']=max(q,s)
                    fills.pop(j);changed=True;break
                if changed:break
            if changed:break
    return fills
