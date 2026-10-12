import UIKit
import WebKit
import AVFoundation

/// Hosts the bundled web game in a WKWebView. The game is fully offline: all files are served from the app bundle
/// through the custom `app://` scheme so ES modules and `fetch` work (they are blocked for `file://` URLs).
final class GameViewController: UIViewController, WKScriptMessageHandler {
    private var webView: WKWebView!
    private let impact = UIImpactFeedbackGenerator(style: .medium)

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: "app")
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        let controller = WKUserContentController()
        controller.add(self, name: "haptic")
        controller.add(self, name: "exportSave")
        config.userContentController = controller
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.contentInsetAdjustmentBehavior = .never   // the page handles safe areas via env(safe-area-inset-*)
        webView.scrollView.bounces = false
        webView.scrollView.isScrollEnabled = false
        webView.isOpaque = true
        webView.backgroundColor = UIColor(red: 10/255, green: 20/255, blue: 36/255, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
        #endif
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        webView.load(URLRequest(url: URL(string: "app://localhost/index.html")!))
    }

    override var prefersStatusBarHidden: Bool { false }
    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .all }

    func notifyLifecycle(_ eventName: String) {
        webView?.evaluateJavaScript("window.dispatchEvent(new Event('\(eventName)'))", completionHandler: nil)
    }

    // MARK: JS -> native bridge
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "haptic":
            impact.impactOccurred()
        case "exportSave":
            guard let text = message.body as? String else { return }
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("modern-age-save.mage")
            do {
                try text.write(to: url, atomically: true, encoding: .utf8)
                let vc = UIActivityViewController(activityItems: [url], applicationActivities: nil)
                vc.popoverPresentationController?.sourceView = view
                present(vc, animated: true)
            } catch { NSLog("Export failed: \(error)") }
        default: break
        }
    }
}
