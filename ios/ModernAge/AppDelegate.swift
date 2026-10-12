import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = GameViewController()
        window.backgroundColor = UIColor(red: 10/255, green: 20/255, blue: 36/255, alpha: 1)
        window.makeKeyAndVisible()
        self.window = window
        return true
    }

    // Persist state whenever the app is about to lose focus: the web layer listens for `pagehide` and autosaves.
    func applicationWillResignActive(_ application: UIApplication) {
        (window?.rootViewController as? GameViewController)?.notifyLifecycle("pagehide")
    }
    func applicationDidEnterBackground(_ application: UIApplication) {
        (window?.rootViewController as? GameViewController)?.notifyLifecycle("pagehide")
    }
}
