"""Blender-bundled Open Image Denoise HDR helper, applied to UV charts only.
No final screenshot pixels are filtered. Fails rather than silently returning
unfiltered noise when the native denoiser is unavailable.
"""
import ctypes,os
from pathlib import Path
import numpy as np
_handles=[]
def denoise_hdr(values):
    if not _handles:
        import bpy
        folder=Path(bpy.app.binary_path).parent/'blender.shared'
        if hasattr(os,'add_dll_directory'):_handles.append(os.add_dll_directory(str(folder)))
        lib=ctypes.CDLL(str(folder/'OpenImageDenoise.dll'));P=ctypes.c_void_p;I=ctypes.c_int;S=ctypes.c_size_t;C=ctypes.c_char_p
        for name,result,args in [('oidnNewDevice',P,[I]),('oidnCommitDevice',None,[P]),('oidnNewFilter',P,[P,C]),('oidnSetSharedFilterImage',None,[P,C,P,I,S,S,S,S,S]),('oidnSetFilterBool',None,[P,C,ctypes.c_bool]),('oidnCommitFilter',None,[P]),('oidnExecuteFilter',None,[P]),('oidnGetDeviceError',I,[P,ctypes.POINTER(C)]),('oidnReleaseFilter',None,[P])]:
            f=getattr(lib,name);f.restype=result;f.argtypes=args
        device=lib.oidnNewDevice(1);lib.oidnCommitDevice(device);_handles.append((lib,device))
    lib,device=_handles[-1];a=np.ascontiguousarray(values,dtype=np.float32);h,w,_=a.shape
    # Reflect padding prevents chart boundaries from being treated as black.
    py=max(16,(32-h+1)//2);px=max(16,(32-w+1)//2);padded=np.ascontiguousarray(np.pad(a,((py,py),(px,px),(0,0)),mode='edge'));out=np.empty_like(padded);hh,ww,_=padded.shape
    f=lib.oidnNewFilter(device,b'RT')
    for name,array in [(b'color',padded),(b'output',out)]:lib.oidnSetSharedFilterImage(f,name,array.ctypes.data,3,ww,hh,0,12,ww*12)
    lib.oidnSetFilterBool(f,b'hdr',True);lib.oidnCommitFilter(f);lib.oidnExecuteFilter(f);message=ctypes.c_char_p();error=lib.oidnGetDeviceError(device,ctypes.byref(message));lib.oidnReleaseFilter(f)
    if error:raise RuntimeError(f'OIDN {error}: {message.value}')
    result=out[py:py+h,px:px+w].copy()
    if not np.isfinite(result).all():raise RuntimeError('OIDN returned non-finite radiance')
    return np.maximum(result,0)
