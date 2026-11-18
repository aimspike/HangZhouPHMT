"""Solar positions use the NOAA approximation and China Standard Time."""
from pathlib import Path
from datetime import date
import math, json

ROOT=Path(__file__).parent
site={'city':'杭州','latitude':30.2741,'longitude':120.1551,'utcOffset':8,
      'balconyAzimuth':190,'planTopAzimuth':10,'date':'2026-11-18'}
day=date.fromisoformat(site['date']).timetuple().tm_yday
g=2*math.pi/365*(day-1)
eq=229.18*(.000075+.001868*math.cos(g)-.032077*math.sin(g)-.014615*math.cos(2*g)-.040849*math.sin(2*g))
dec=.006918-.399912*math.cos(g)+.070257*math.sin(g)-.006758*math.cos(2*g)+.000907*math.sin(2*g)-.002697*math.cos(3*g)+.00148*math.sin(3*g)
lat=math.radians(site['latitude'])
noon=(720-4*site['longitude']-eq+site['utcOffset']*60)/60
ha=math.acos((math.cos(math.radians(90.833))-math.sin(lat)*math.sin(dec))/(math.cos(lat)*math.cos(dec)))
rise=noon-math.degrees(ha)/15
setting=noon+math.degrees(ha)/15

def position(hour):
    h=math.radians((hour-noon)*15)
    east=-math.cos(dec)*math.sin(h)
    north=math.cos(lat)*math.sin(dec)-math.sin(lat)*math.cos(dec)*math.cos(h)
    up=math.sin(lat)*math.sin(dec)+math.cos(lat)*math.cos(dec)*math.cos(h)
    az=math.degrees(math.atan2(east,north))%360
    a=math.radians(site['planTopAzimuth'])
    return {'direction':[east*math.cos(a)-north*math.sin(a),up,-east*math.sin(a)-north*math.cos(a)],
            'altitude':math.degrees(math.asin(up)),'azimuth':az}

presets=[]
for key,name,hour,values in [
    ('morning','清晨',rise+.7,dict(sunColor='#ffd1a1',sunPower=2.1,ambient=.42,fill=.1,zenith='#6e9ec8',horizon='#f3d8b6',cloud='#fff1da',fog='#bfcad0',exposure=.98,night=0)),
    ('noon','正午',noon,dict(sunColor='#fff3d8',sunPower=1.85,ambient=.58,fill=.18,zenith='#4b8bc3',horizon='#c6e2ee',cloud='#ffffff',fog='#c5d8df',exposure=.92,night=0)),
    ('dusk','黄昏',setting-.4,dict(sunColor='#ff965c',sunPower=1.75,ambient=.29,fill=.07,zenith='#605c8d',horizon='#f0b07e',cloud='#efb89b',fog='#b9a7ad',exposure=1.04,night=.16)),
    ('night','夜晚',21,dict(sunColor='#a5baff',sunPower=0,ambient=.1,fill=.045,zenith='#071326',horizon='#263b56',cloud='#52657e',fog='#15273c',exposure=1.1,night=1))
]:
    minutes=round(hour*60)
    presets.append(dict(id=key,name=name,hour=hour,time=f'{minutes//60:02d}:{minutes%60:02d}',**position(hour),**values))
site.update(presets=presets,sunrise=f'{int(rise):02d}:{round(rise%1*60):02d}',sunset=f'{int(setting):02d}:{round(setting%1*60):02d}')
(ROOT/'solar-presets.json').write_text(json.dumps(site,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps(site,ensure_ascii=False,indent=2))
