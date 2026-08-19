import ExpoModulesCore

public class IsTestflightModule: Module {
  public func definition() -> ModuleDefinition {
    Name("IsTestflight")

    Function("isTestFlight") { () -> Bool in
      #if targetEnvironment(simulator)
      return false
      #else
      guard let path = Bundle.main.appStoreReceiptURL?.path else {
        return false
      }
      // TestFlight installs use a sandbox receipt path.
      return path.contains("sandboxReceipt")
      #endif
    }
  }
}
