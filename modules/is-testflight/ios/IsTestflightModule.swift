import ExpoModulesCore

public class IsTestflightModule: Module {
  public func definition() -> ModuleDefinition {
    Name("IsTestflight")

    Function("isTestFlight") { () -> Bool in
      #if targetEnvironment(simulator)
      return false
      #else
      let isSandboxReceipt = Bundle.main.appStoreReceiptURL?.lastPathComponent == "sandboxReceipt"
      let hasEmbeddedProvision = Bundle.main.path(forResource: "embedded", ofType: "mobileprovision") != nil
      return isSandboxReceipt && !hasEmbeddedProvision
      #endif
    }
  }
}
