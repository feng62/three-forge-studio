import { WebIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
// @ts-ignore
import draco3d from 'draco3d';

import decoderWasmUrl from 'draco3d/draco_decoder.wasm?url';
import encoderWasmUrl from 'draco3d/draco_encoder.wasm?url';

let encoderModule: any = null;
let decoderModule: any = null;
let io: WebIO | null = null;

export async function getWebIO(): Promise<WebIO> {
  if (io) return io;

  if (!encoderModule) {
    encoderModule = await draco3d.createEncoderModule({
      locateFile: (path: string) => {
        if (path === 'draco_encoder.wasm') return encoderWasmUrl;
        return path;
      }
    });
  }
  if (!decoderModule) {
    decoderModule = await draco3d.createDecoderModule({
      locateFile: (path: string) => {
        if (path === 'draco_decoder.wasm') return decoderWasmUrl;
        return path;
      }
    });
  }

  io = new WebIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.decoder': await decoderModule,
      'draco3d.encoder': await encoderModule,
    });
  
  return io;
}

export async function compressGLB(
  buffer: ArrayBuffer | Uint8Array,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<Uint8Array> {
  const io = await getWebIO();
  const document = await io.readBinary(new Uint8Array(buffer));

  let quantizePosition = 14;
  let quantizeNormal = 10;
  let quantizeTexcoord = 12;
  
  if (quality === 'low') {
    quantizePosition = 11;
    quantizeNormal = 8;
    quantizeTexcoord = 10;
  } else if (quality === 'high') {
    quantizePosition = 16;
    quantizeNormal = 12;
    quantizeTexcoord = 14;
  }

  await document.transform(
    draco({ 
      quantizePosition, 
      quantizeNormal, 
      quantizeTexcoord
    })
  );

  return await io.writeBinary(document);
}

export async function decompressGLB(buffer: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  const io = await getWebIO();
  const document = await io.readBinary(new Uint8Array(buffer));

  // Removing the KHR_draco_mesh_compression extension
  const dracoExtension = document.createExtension(KHRDracoMeshCompression);
  if (dracoExtension) {
    dracoExtension.dispose();
  }

  // Rewrite without draco compression
  return await io.writeBinary(document);
}
