import type JSONManager from '../src/config/JSONManager'

declare global {
  export class ManifestServiceType extends JSONManager {
    /**
     * @deprecated
     */
    extensionId: number

    extensionUUID: string
    institution: string
    type: string
    name: string
    meta?: ExtensionMeta
  }

  export interface IRemoteExtension {
    extension_uuid: string
    title: string;
    id: number;
    type?: string
    meta?: ExtensionMeta
  }
}
