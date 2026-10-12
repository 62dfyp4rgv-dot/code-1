import WebKit
import UniformTypeIdentifiers

/// Serves files from the bundled `www` folder for URLs such as app://localhost/js/main.js.
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    static let mime: [String: String] = [
        "html": "text/html; charset=utf-8", "js": "text/javascript; charset=utf-8", "css": "text/css; charset=utf-8",
        "json": "application/json", "csv": "text/csv; charset=utf-8", "psv": "text/plain; charset=utf-8",
        "png": "image/png", "svg": "image/svg+xml", "webmanifest": "application/manifest+json",
    ]

    /// Resolves a request path inside `www`, refusing anything that escapes the folder.
    static func resolve(path rawPath: String, bundle: Bundle = .main) -> URL? {
        guard let root = bundle.url(forResource: "www", withExtension: nil) else { return nil }
        var path = rawPath.removingPercentEncoding ?? rawPath
        if path.hasSuffix("/") || path.isEmpty { path += "index.html" }
        let file = root.appendingPathComponent(path).standardizedFileURL
        guard file.path.hasPrefix(root.standardizedFileURL.path) else { return nil }
        return FileManager.default.fileExists(atPath: file.path) ? file : nil
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url, let file = Self.resolve(path: url.path), let data = try? Data(contentsOf: file) else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        let type = Self.mime[file.pathExtension.lowercased()] ?? "application/octet-stream"
        let headers = ["Content-Type": type, "Content-Length": "\(data.count)", "Cache-Control": "no-cache"]
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}
