import BitmovinPlayer

@objc(SourceModule)
class SourceModule: NSObject, RCTBridgeModule {
    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// In-memory mapping from `nativeId`s to `Source` instances.
    private var sources: Registry<Source> = [:]

    /// JS module name.
    static func moduleName() -> String! {
        "SourceModule"
    }

    /// Module requires main thread initialization.
    static func requiresMainQueueSetup() -> Bool {
        true
    }

    /// Use `UIManager.addBlock` to enqueue module methods on UI thread.
    var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    /**
     Fetches the `Source` instance associated with `nativeId` from internal sources.
     - Parameter nativeId: `Source` instance ID.
     - Returns: The associated `Source` instance or `nil`.
     */
    @objc func retrieve(_ nativeId: NativeId) -> Source? {
        sources[nativeId]
    }

    /**
     Creates a new `Source` instance inside the internal sources using the provided `config` object.
     - Parameter nativeId: ID to be associated with the `Source` instance.
     - Parameter config: `SourceConfig` object received from JS.
     */
    @objc(initWithConfig:config:)
    func initWithConfig(_ nativeId: NativeId, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.sources[nativeId] == nil,
                let sourceConfig = RCTConvert.sourceConfig(config)
            else {
                return
            }
            self?.sources[nativeId] = SourceFactory.create(from: sourceConfig)
        }
    }

    /**
     Creates a new `Source` instance inside the internal sources using the provided `config` object and an initialized DRM configuration ID.
     - Parameter nativeId: ID to be associated with the `Source` instance.
     - Parameter drmNativeId: ID of the DRM config object to use.
     - Parameter config: `SourceConfig` object received from JS.
     */
    @objc(initWithDrmConfig:drmNativeId:config:)
    func initWithDrmConfig(_ nativeId: NativeId, drmNativeId: NativeId, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.sources[nativeId] == nil,
                let fairplayConfig = self?.getDrmModule()?.retrieve(drmNativeId),
                let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: fairplayConfig)
            else {
                return
            }
            self?.sources[nativeId] = SourceFactory.create(from: sourceConfig)
        }
    }

    /// Fetches the initialized `DrmModule` instance on RN's bridge object.
    private func getDrmModule() -> DrmModule? {
        bridge.module(for: DrmModule.self) as? DrmModule
    }

    /**
     Removes the `Source` instance associated with `nativeId` from `sources`.
     - Parameter nativeId: Instance to be disposed.
     */
    @objc(destroy:)
    func destroy(_ nativeId: NativeId) {
        sources.removeValue(forKey: nativeId)
    }

    /**
     Whether `nativeId` source is currently attached to a player instance.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isAttachedToPlayer:resolver:rejecter:)
    func isAttachedToPlayer(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.sources[nativeId]?.isAttachedToPlayer)
        }
    }

    /**
     Whether `nativeId` source is currently active in a `Player`.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isActive:resolver:rejecter:)
    func isActive(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.sources[nativeId]?.isActive)
        }
    }

    /**
     The duration of `nativeId` source in seconds.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(duration:resolver:rejecter:)
    func duration(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.sources[nativeId]?.duration)
        }
    }

    /**
     The current loading state of `nativeId` source.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(loadingState:resolver:rejecter:)
    func loadingState(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.sources[nativeId]?.loadingState)
        }
    }

    /**
     Metadata for the currently loaded `nativeId` source.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getMetadata:resolver:rejecter:)
    func getMetadata(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.sources[nativeId]?.metadata)
        }
    }

    /**
     Set the metadata for a loaded `nativeId` source.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(setMetadata:metadata:)
    func setMetadata(_ nativeId: NativeId, metadata: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let metadata = metadata as? [String: AnyObject] else {
                return
            }
            self?.sources[nativeId]?.metadata = metadata
        }
    }
}